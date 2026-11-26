"""Infraestructura común de las herramientas del agente.

Cada herramienta es una función pura sobre un RunContext con entrada validada por
Pydantic y salida estructurada (dict). La capa de eventos traduce cada llamada a
mensajes de negocio; las herramientas no saben nada de la interfaz.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable

from pydantic import BaseModel, ValidationError

from app.config import Settings
from app.events.bus import RunEventBus
from app.persistence.db import Database, dumps


class ToolError(Exception):
    """Error esperado: se devuelve al modelo como resultado con is_error, sin romper la ejecución."""

    def __init__(self, message: str, code: str = "tool_error", hint: str | None = None):
        super().__init__(message)
        self.code = code
        self.hint = hint


@dataclass
class ToolOutcome:
    data: dict[str, Any]
    images: list[tuple[str, str]] = field(default_factory=list)  # (base64, mime)


@dataclass
class ToolSpec:
    name: str
    description: str
    input_model: type[BaseModel]
    handler: Callable[["RunContext", Any], ToolOutcome]
    read_only: bool = True


@dataclass
class RunContext:
    db: Database
    settings: Settings
    bus: RunEventBus
    run_id: str
    email_id: str
    case_id: str | None = None
    client_id: str | None = None
    period: str = ""
    finalized: bool = False
    tool_calls: int = 0
    fault_counters: dict[str, int] = field(default_factory=dict)
    activities: list[dict] = field(default_factory=list)

    # -- utilidades de datos ------------------------------------------------
    def email(self) -> dict:
        return self.db.one("SELECT * FROM emails WHERE id=?", (self.email_id,))  # type: ignore[return-value]

    def attachments(self) -> list[dict]:
        return self.db.all("SELECT * FROM attachments WHERE email_id=? ORDER BY position", (self.email_id,))

    def attachment(self, attachment_id: str) -> dict:
        att = self.db.one("SELECT * FROM attachments WHERE id=? AND email_id=?", (attachment_id, self.email_id))
        if not att:
            valid = ", ".join(a["id"] for a in self.attachments())
            raise ToolError(f"El adjunto '{attachment_id}' no pertenece a este correo. Adjuntos válidos: {valid}.", "unknown_attachment")
        return att

    def require_case(self) -> str:
        if not self.case_id:
            raise ToolError("Todavía no hay expediente abierto. Abre el expediente antes de esta acción.", "no_case")
        return self.case_id

    def latest_extraction(self, attachment_id: str) -> dict | None:
        row = self.db.one(
            "SELECT * FROM extractions WHERE case_id=? AND attachment_id=? ORDER BY attempt DESC LIMIT 1",
            (self.case_id, attachment_id),
        )
        if row:
            import json
            row["data"] = json.loads(row["data"])
            row["issues"] = json.loads(row["issues"])
        return row

    def audit(self, action: str, detail: Any, actor: str = "agente") -> None:
        self.db.execute(
            "INSERT INTO audit_log VALUES (?,?,?,?,?,?)",
            (self.case_id, self.run_id, now_iso(), actor, action, dumps(detail)),
        )


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def execute_tool(ctx: RunContext, spec: ToolSpec, raw_args: dict[str, Any], presenter) -> ToolOutcome | ToolError:
    """Valida la entrada, ejecuta, emite eventos de actividad y captura errores.

    Devuelve el ToolOutcome o el ToolError (para que el adaptador lo marque como error).
    """
    ctx.tool_calls += 1
    activity_id = f"act-{ctx.tool_calls}"
    started = time.monotonic()

    try:
        args = spec.input_model.model_validate(raw_args or {})
    except ValidationError as e:
        problems = "; ".join(f"{'.'.join(map(str, err['loc']))}: {err['msg']}" for err in e.errors())
        err = ToolError(f"Entrada no válida: {problems}", "invalid_input")
        presenter.on_error(ctx, spec.name, raw_args or {}, err, activity_id, started=False)
        return err

    presenter.on_start(ctx, spec.name, args, activity_id)
    try:
        faults = ctx.settings.fault_injection.get(spec.name, 0)
        used = ctx.fault_counters.get(spec.name, 0)
        if used < faults:
            ctx.fault_counters[spec.name] = used + 1
            raise ToolError("El servicio de consulta no responde (fallo transitorio). Puedes reintentar.", "transient")
        outcome = spec.handler(ctx, args)
    except ToolError as err:
        presenter.on_error(ctx, spec.name, args, err, activity_id, started=True)
        ctx.audit(f"error:{spec.name}", {"code": err.code, "message": str(err)})
        return err
    except Exception as exc:  # noqa: BLE001 - un fallo inesperado no debe tumbar al agente
        err = ToolError(f"Error interno al ejecutar la acción: {type(exc).__name__}", "internal")
        presenter.on_error(ctx, spec.name, args, err, activity_id, started=True)
        ctx.audit(f"error:{spec.name}", {"code": "internal", "message": repr(exc)})
        return err

    duration_ms = int((time.monotonic() - started) * 1000)
    presenter.on_finish(ctx, spec.name, args, outcome.data, activity_id, duration_ms)
    ctx.audit(spec.name, {"args": args.model_dump(), "result_keys": sorted(outcome.data.keys())})
    return outcome
