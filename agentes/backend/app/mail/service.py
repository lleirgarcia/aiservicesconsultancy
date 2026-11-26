"""Servicio de la bandeja: recibe correos externos, el coordinador elige el agente y se lanza con ese correo como entrada."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Protocol

from app.agent.orchestrator import AgentUnavailable, RunBusy, RunManager
from app.config import Settings
from app.coordinator.coordinator import Coordinator
from app.persistence.db import Database

from .ingest import parse_message, store

log = logging.getLogger("kroomix.mail")
MAX_ATTEMPTS = 3


class MailSource(Protocol):
    def fetch_new(self) -> list[tuple[bytes, bytes]]: ...
    def mark_seen(self, uids: list[bytes]) -> None: ...


def _now() -> str:
    return datetime.now().isoformat(timespec="seconds")


class InboxService:
    def __init__(self, db: Database, settings: Settings, runs: RunManager, coordinator: Coordinator, source: MailSource | None = None):
        self.db, self.settings, self.runs, self.coordinator, self.source = db, settings, runs, coordinator, source
        self.allowed = {a.strip().lower() for a in settings.inbox_allowed_senders.split(",") if a.strip()}

    # -- recepción -------------------------------------------------------------------
    def ingest(self, raw: bytes) -> str | None:
        m = parse_message(raw, self.settings.inbox_max_attachment_mb * 1024 * 1024)
        email_id = store(self.db, self.settings, m)
        if email_id and self.allowed and m.from_address not in self.allowed:
            self._set(email_id, "ignorado", note="Remitente no permitido.")
        return email_id

    async def poll_once(self) -> int:
        if not self.source:
            return 0
        fetched = await asyncio.to_thread(self.source.fetch_new)
        for _, raw in fetched:
            try:
                self.ingest(raw)
            except Exception:  # noqa: BLE001 - un correo imposible de leer no debe bloquear la bandeja
                log.exception("no se ha podido leer un correo")
        await asyncio.to_thread(self.source.mark_seen, [uid for uid, _ in fetched])
        return len(fetched)

    # -- decisión y lanzamiento ----------------------------------------------------------
    def _set(self, email_id: str, status: str, agent_id: str | None = None, run_id: str | None = None, note: str | None = None) -> None:
        self.db.execute("UPDATE inbound_emails SET status=?, agent_id=COALESCE(?, agent_id), run_id=COALESCE(?, run_id), note=COALESCE(?, note), updated_at=? "
                        "WHERE email_id=?", (status, agent_id, run_id, note, _now(), email_id))

    def _launched_last_hour(self) -> int:
        since = (datetime.now() - timedelta(hours=1)).isoformat(timespec="seconds")
        return self.db.one("SELECT count(*) AS n FROM inbound_emails WHERE status='lanzado' AND updated_at>=?", (since,))["n"]  # type: ignore[index]

    async def dispatch_pending(self) -> None:
        """Procesa los correos pendientes de uno en uno, del más antiguo al más nuevo, cuando no hay otra ejecución."""
        while True:
            row = self.db.one("SELECT email_id, attempts FROM inbound_emails WHERE status='pendiente' ORDER BY received_at LIMIT 1")
            if not row or self.runs.active_run():
                return
            email_id = row["email_id"]
            if self._launched_last_hour() >= self.settings.inbox_max_runs_per_hour:
                self._set(email_id, "ignorado", note=f"Límite de {self.settings.inbox_max_runs_per_hour} ejecuciones por hora alcanzado.")
                continue
            try:
                await self._route(email_id)
            except Exception as exc:  # noqa: BLE001
                attempts = row["attempts"] + 1
                self.db.execute("UPDATE inbound_emails SET attempts=?, updated_at=? WHERE email_id=?", (attempts, _now(), email_id))
                log.warning("no se ha podido decidir el agente (%s), intento %s", type(exc).__name__, attempts)
                if attempts >= MAX_ATTEMPTS:
                    self._set(email_id, "error", note="No se ha podido conectar con el servicio de IA.")
                    continue
                return  # se reintenta en el siguiente ciclo

    async def _route(self, email_id: str) -> None:
        em = self.db.one("SELECT * FROM emails WHERE id=?", (email_id,))
        atts = self.db.all("SELECT filename FROM attachments WHERE email_id=? ORDER BY position", (email_id,))
        names = ", ".join(a["filename"] for a in atts)
        text = (f"Ha llegado un correo de {em['from_name']} <{em['from_address']}>.\nAsunto: {em['subject']}\n"
                f"Adjuntos: {len(atts)}{' (' + names + ')' if names else ''}\n\n{em['body'][:1500]}")
        outcome = await self.coordinator.handle(text, lambda agent_id: self.runs.start(email_id, agent_id))
        if outcome.action == "launched":
            self._set(email_id, "lanzado", outcome.agent_id, outcome.run_id)
        else:
            self._set(email_id, "respondido", note=outcome.reply)

    def launch_manual(self, email_id: str, agent_id: str) -> str:
        """El usuario elige el agente para un correo que el coordinador no ha sabido asignar. Lanza RunBusy/AgentUnavailable/LookupError."""
        if not self.db.one("SELECT 1 FROM inbound_emails WHERE email_id=?", (email_id,)):
            raise KeyError(email_id)
        run_id = self.runs.start(email_id, agent_id)
        self._set(email_id, "lanzado", agent_id, run_id)
        return run_id

    # -- bucle --------------------------------------------------------------------------
    async def run_forever(self) -> None:
        log.info("Bandeja activa: escuchando los correos enviados a %s", self.settings.imap_alias)
        while True:
            try:
                await self.poll_once()
                await self.dispatch_pending()
            except asyncio.CancelledError:
                raise
            except Exception as exc:  # noqa: BLE001 - sin red, credenciales incorrectas…: se reintenta, sin volcar datos
                log.warning("bandeja: %s", type(exc).__name__)
            await asyncio.sleep(self.settings.inbox_poll_s)

    # -- consulta ----------------------------------------------------------------------
    def list(self, limit: int = 10) -> list[dict]:
        rows = self.db.all(
            "SELECT i.email_id, i.status, i.agent_id, i.run_id, i.note, i.updated_at, e.from_name, e.from_address, e.subject, e.received_at, "
            "(SELECT count(*) FROM attachments a WHERE a.email_id=i.email_id) AS attachments "
            "FROM inbound_emails i JOIN emails e ON e.id=i.email_id ORDER BY i.received_at DESC LIMIT ?", (limit,))
        return rows
