"""Ciclo de vida de una ejecución: límites, tiempo real, trazabilidad y cierre."""

from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime

from app.agents.registry import AGENTS_BY_ID
from app.agents.runtime import get_runtime
from app.config import Settings
from app.events.bus import RunEventBus
from app.persistence.db import Database
from app.tools.base import RunContext, execute_tool

from .runners import AgentRunner, build_runner

log = logging.getLogger("kroomix.orchestrator")


class RunBusy(Exception):
    pass


class AgentUnavailable(Exception):
    """El agente existe en el catálogo pero todavía no se puede ejecutar («próximamente»)."""


class RunManager:
    def __init__(self, db: Database, settings: Settings, runner: AgentRunner | None = None):
        self.db, self.settings = db, settings
        self.runner = runner or build_runner(settings)
        self.buses: dict[str, RunEventBus] = {}
        self.tasks: dict[str, asyncio.Task] = {}
        # Si el servidor se reinició con una ejecución a medias, se marca como interrumpida.
        db.execute("UPDATE runs SET status='interrumpida' WHERE status='en_curso'")

    def active_run(self) -> str | None:
        for run_id, task in self.tasks.items():
            if not task.done():
                return run_id
        return None

    def start(self, email_id: str | None = None, agent_id: str = "gestion-documental") -> str:
        manifest = AGENTS_BY_ID.get(agent_id)
        if not manifest:
            raise LookupError(agent_id)
        if manifest.status != "disponible":
            raise AgentUnavailable(agent_id)
        email_id = email_id or manifest.default_scenario
        if self.active_run():
            raise RunBusy(self.active_run())
        email = self.db.one("SELECT * FROM emails WHERE id=?", (email_id,))
        if not email:
            raise KeyError(email_id)
        run_id = f"run-{datetime.now():%Y%m%d-%H%M%S}-{uuid.uuid4().hex[:4]}"
        self.db.execute("INSERT INTO runs (id, email_id, status, model, started_at, agent_id) VALUES (?,?,?,?,?,?)",
                        (run_id, email_id, "en_curso", self.settings.model, datetime.now().isoformat(timespec="seconds"), agent_id))
        bus = RunEventBus(self.db, run_id, agent_id)
        self.buses[run_id] = bus
        self.tasks[run_id] = asyncio.create_task(self._run(run_id, email, bus))
        return run_id

    async def _run(self, run_id: str, email: dict, bus: RunEventBus) -> None:
        ctx = RunContext(db=self.db, settings=self.settings, bus=bus, run_id=run_id, email_id=email["id"])
        runtime = get_runtime(bus.agent_id)
        presenter = runtime.make_presenter()
        attachments = ctx.attachments()
        bus.emit("run_started", {"run_id": run_id, "email_id": email["id"], "phases": [{"id": p, "label": l} for p, l in presenter.phases], "kpi_labels": presenter.kpi_labels,
                                 "documents_total": len(attachments), "started_at": datetime.now().isoformat(timespec="seconds")})
        bus.emit("activity_started", {"id": "act-0", "phase": "recepcion", "label": "Recibiendo el correo"})
        bus.emit("activity_finished", {"id": "act-0", "status": "done", "label": f"Correo de {email['from_name']} recibido",
                                       "detail": f"«{email['subject']}»" + (f" · {len(attachments)} documentos adjuntos" if attachments else "")})

        def execute(c, spec, args):
            if c.finalized and spec.name != "log_event":
                from app.tools.base import ToolError
                return ToolError("El expediente ya está cerrado.", "closed")
            return execute_tool(c, spec, args, presenter)

        def followup() -> str | None:
            return runtime.followup(ctx)

        status, error, stats = "completada", None, None
        try:
            stats = await asyncio.wait_for(
                self.runner.run(ctx, runtime.system_prompt, runtime.build_user_message(email, attachments), runtime.tools, execute, followup),
                timeout=self.settings.run_timeout_s)
            if stats.error and not ctx.finalized:
                status, error = "error", stats.error
            elif not ctx.finalized:
                status, error = "incompleta", f"El agente terminó sin cerrar el expediente ({stats.stop})."
        except asyncio.TimeoutError:
            status, error = "error", f"Se ha superado el tiempo máximo de {self.settings.run_timeout_s} s."
        except Exception as exc:  # noqa: BLE001
            log.exception("run failed")
            status, error = "error", _friendly(exc)

        duration_ms = bus.elapsed_ms()
        case = self.db.one("SELECT result FROM cases WHERE run_id=?", (run_id,))
        result = json.loads(case["result"]) if case and case["result"] else None
        self.db.execute("UPDATE runs SET status=?, finished_at=?, duration_ms=?, error=?, cost_usd=?, turns=? WHERE id=?",
                        (status, datetime.now().isoformat(timespec="seconds"), duration_ms, error,
                         stats.cost_usd if stats else None, stats.turns if stats else None, run_id))
        if ctx.finalized:
            presenter.refresh_metrics(ctx)
        cost_usd = stats.cost_usd if stats else None
        bus.emit("run_finished", {"status": status, "error": error, "duration_ms": duration_ms, "case": result,
                                  "automated_actions": presenter.metrics["actions"],
                                  "ai_cost_eur": round(cost_usd * self.settings.usd_eur, 4) if cost_usd else None})
        bus.close()


def _friendly(exc: Exception) -> str:
    name = type(exc).__name__
    if name in ("CLINotFoundError",):
        return "No se encuentra el programa de Claude en este equipo."
    if name in ("CLIConnectionError", "ProcessError"):
        return "No se ha podido conectar con el servicio de IA. Comprueba la conexión a internet."
    return f"Error inesperado ({name})."
