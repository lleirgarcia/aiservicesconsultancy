"""Cómo se ejecuta cada agente: instrucciones, herramientas, presentador y reintentos.

El orquestador no conoce a ningún agente concreto: pide su `AgentRuntime` por identificador. Añadir un agente es
añadir aquí su entrada (más su manifiesto en `registry.py`).
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from app.tools.base import RunContext, ToolSpec


@dataclass
class AgentRuntime:
    system_prompt: str
    build_user_message: Callable[[dict, list[dict]], str]
    tools: list[ToolSpec]
    make_presenter: Callable[[], object]
    followup: Callable[[RunContext], str | None]


def _pending(ctx: RunContext) -> tuple[int, int]:
    n_inc = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (ctx.case_id,))["n"]
    n_tasks = ctx.db.one("SELECT count(*) AS n FROM review_tasks WHERE case_id=?", (ctx.case_id,))["n"]
    return n_inc, n_tasks


def documental_followup(ctx: RunContext) -> str | None:
    """Reintento controlado: si el agente se detiene sin cerrar, se le dice exactamente qué falta."""
    if ctx.finalized:
        return None
    if not ctx.case_id:
        return "No has abierto el expediente. Continúa el trabajo hasta cerrarlo."
    missing = [a["filename"] for a in ctx.attachments()
               if not ctx.db.one("SELECT 1 FROM case_documents WHERE case_id=? AND attachment_id=?", (ctx.case_id, a["id"]))]
    n_inc, n_tasks = _pending(ctx)
    todo = []
    if missing:
        todo.append("archivar " + ", ".join(f"«{m}»" for m in missing))
    if n_tasks < n_inc:
        todo.append(f"crear una tarea de revisión por cada incidencia ({n_inc} incidencias, {n_tasks} tareas)")
    todo.append("cerrar el expediente")
    return "El expediente todavía no está cerrado. Falta: " + "; ".join(todo) + ". Hazlo ahora con tus herramientas."


def presupuestos_followup(ctx: RunContext) -> str | None:
    if ctx.finalized:
        return None
    if not ctx.case_id:
        return "No has abierto el presupuesto. Continúa el trabajo hasta cerrarlo."
    n_inc, n_tasks = _pending(ctx)
    todo = []
    if n_tasks < n_inc:
        todo.append(f"crear una tarea de revisión por cada incidencia ({n_inc} incidencias, {n_tasks} tareas)")
    todo.append("cerrar el presupuesto con finalize_quote")
    return "El presupuesto todavía no está cerrado. Falta: " + "; ".join(todo) + ". Hazlo ahora con tus herramientas."


def renovaciones_followup(ctx: RunContext) -> str | None:
    if ctx.finalized:
        return None
    if not ctx.case_id:
        return "No has abierto la revisión. Continúa el trabajo hasta cerrarla."
    n_inc, n_tasks = _pending(ctx)
    todo = []
    if n_tasks < n_inc:
        todo.append(f"crear una tarea de revisión por cada incidencia ({n_inc} incidencias, {n_tasks} tareas)")
    todo.append("revisar todas las pólizas de la ventana y cerrar con finalize_renewal")
    return "La revisión todavía no está cerrada. Falta: " + "; ".join(todo) + ". Hazlo ahora con tus herramientas."


def auditor_followup(ctx: RunContext) -> str | None:
    if ctx.finalized:
        return None
    if not ctx.case_id:
        return "No has abierto la auditoría. Continúa el trabajo hasta cerrarla."
    n_inc, n_tasks = _pending(ctx)
    todo = []
    if n_tasks < n_inc:
        todo.append(f"crear una tarea de revisión por cada incidencia ({n_inc} incidencias, {n_tasks} tareas)")
    todo.append("auditar todas las facturas del proveedor y cerrar con finalize_audit")
    return "La auditoría todavía no está cerrada. Falta: " + "; ".join(todo) + ". Hazlo ahora con tus herramientas."


def get_runtime(agent_id: str) -> AgentRuntime:
    # Importaciones perezosas: evitan ciclos y no cargan agentes que no se ejecutan.
    if agent_id == "gestion-documental":
        from app.agent.prompt import SYSTEM_PROMPT, build_user_message
        from app.events.presenter import Presenter
        from app.tools.catalog import TOOLS
        return AgentRuntime(SYSTEM_PROMPT, build_user_message, TOOLS, Presenter, documental_followup)
    if agent_id == "presupuestos":
        from .presupuestos.presenter import QuotePresenter
        from .presupuestos.prompt import SYSTEM_PROMPT, build_user_message
        from .presupuestos.tools import TOOLS
        return AgentRuntime(SYSTEM_PROMPT, build_user_message, TOOLS, QuotePresenter, presupuestos_followup)
    if agent_id == "renovaciones":
        from .renovaciones.presenter import RenewalPresenter
        from .renovaciones.prompt import SYSTEM_PROMPT, build_user_message
        from .renovaciones.tools import TOOLS
        return AgentRuntime(SYSTEM_PROMPT, build_user_message, TOOLS, RenewalPresenter, renovaciones_followup)
    if agent_id == "auditor-facturas":
        from .auditor_facturas.presenter import AuditPresenter
        from .auditor_facturas.prompt import SYSTEM_PROMPT, build_user_message
        from .auditor_facturas.tools import TOOLS
        return AgentRuntime(SYSTEM_PROMPT, build_user_message, TOOLS, AuditPresenter, auditor_followup)
    raise LookupError(agent_id)
