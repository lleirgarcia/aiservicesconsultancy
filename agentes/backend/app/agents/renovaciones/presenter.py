"""Traduce las acciones del agente de renovaciones a lenguaje de negocio (sin términos técnicos)."""

from __future__ import annotations

import json

from app.events.presenter import Presenter, _business_error, eur, period_label
from app.tools.base import RunContext, ToolError
from app.validation import renewals as rv

PHASES = [
    ("recepcion", "Recepción"),
    ("cliente", "Cliente"),
    ("cartera", "Cartera"),
    ("revision", "Revisión"),
    ("comunicacion", "Correo"),
    ("renovacion", "Cierre"),
]
TOOL_PHASE = {
    "find_client": "cliente", "get_renewal_rules": "cartera", "list_client_policies": "cartera", "open_renewal": "renovacion",
    "review_policy": "revision", "flag_issue": "revision", "create_review_task": "comunicacion",
    "prepare_email_draft": "comunicacion", "finalize_renewal": "renovacion",
}
RENEWAL_ERRORS = {
    "unknown_policy": "Esa póliza no es de este cliente",
    "outside_window": "Esa póliza vence fuera del plazo que se gestiona",
    "flags_require_review": "Con alertas no se renueva sin revisión humana",
    "unreviewed_policies": "Quedan pólizas por revisar",
    "source_not_in_request": "La cita no aparece en la petición",
    "confidential": "El correo no puede incluir información interna",
    "missing_review_tasks": "Cada incidencia necesita una tarea para tu equipo",
    "no_case": "Falta abrir la revisión",
    "unknown_client": "Ese cliente no existe",
}
KIND_TITLE = {**rv.FLAG_TITLES, "dato_faltante": "Dato que falta", "instruccion_sospechosa": "Instrucción sospechosa",
              "cliente_nuevo": "Posible cliente nuevo", "condicion_solicitada": "Condición que no consta en la oferta"}


def _date(iso: str) -> str:
    y, m, d = iso.split("-")
    return f"{int(d)}/{m}/{y}"


class RenewalPresenter(Presenter):
    tool_phase = TOOL_PHASE
    phases = PHASES
    kpi_labels = {"processed": "Pólizas revisadas", "incidents": "Alertas y pendientes", "actions": "Acciones realizadas", "time": "Tiempo recuperado"}

    def business_error(self, err: ToolError) -> str:
        return RENEWAL_ERRORS.get(err.code) or _business_error(err)

    def refresh_metrics(self, ctx: RunContext) -> None:
        if not ctx.case_id:
            return
        m = self.metrics
        m["documents_total"] = 0
        m["documents_processed"] = ctx.db.one("SELECT count(*) AS n FROM renewal_reviews WHERE case_id=?", (ctx.case_id,))["n"]
        m["incidents"] = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (ctx.case_id,))["n"]
        saved = ctx.settings.renewal_manual_minutes - ctx.settings.renewal_review_minutes
        progress = 1.0 if ctx.finalized else min(0.9, m["actions"] / 12 * 0.9)
        m["minutes_saved"] = round(saved * progress, 1)
        ctx.bus.emit("metrics", dict(m))

    # -- textos ----------------------------------------------------------------
    def _policy(self, ctx: RunContext, policy_id: str | None) -> str:
        row = ctx.db.one("SELECT product, insurer FROM policies WHERE id=?", (policy_id,)) if policy_id else None
        return f"«{row['product']}» ({row['insurer']})" if row else "la póliza"

    def start_label(self, ctx: RunContext, tool: str, a: dict) -> str:
        return {
            "find_client": "Identificando al cliente",
            "get_renewal_rules": "Consultando las condiciones de renovación",
            "list_client_policies": "Consultando las pólizas del cliente",
            "open_renewal": "Abriendo la revisión de renovaciones",
            "review_policy": f"Revisando {self._policy(ctx, a.get('policy_id'))}",
            "flag_issue": "Revisando algo que requiere atención",
            "create_review_task": "Creando una tarea para tu equipo",
            "prepare_email_draft": "Preparando el correo para el cliente",
            "finalize_renewal": "Cerrando la revisión de renovaciones",
        }.get(tool, "Procesando")

    def finish_label(self, ctx: RunContext, tool: str, a: dict, d: dict) -> tuple[str, str, str | None]:
        if tool == "find_client":
            if d["status"] == "identified":
                return "done", f"Cliente identificado: {d['client']['legal_name']}", f"Por {d['matched_by']}"
            return "review", "Cliente no identificado", "Lo confirmará una persona del equipo"
        if tool == "get_renewal_rules":
            return "done", f"{len(d['rules'])} condiciones internas aplicadas", f"Se gestionan los vencimientos de los próximos {d['window_days']} días"
        if tool == "list_client_policies":
            n, t = d["in_window"], len(d["policies"])
            return "done", f"{t} pólizas consultadas", (f"{n} vencen en los próximos {rv.WINDOW_DAYS} días" if n else f"Ninguna vence en los próximos {rv.WINDOW_DAYS} días")
        if tool == "open_renewal":
            return "done", f"Revisión {d['renewal_id']} abierta", period_label(d["period"]).capitalize()
        if tool == "review_policy":
            when = f"vence el {_date(d['renewal_date'])} (en {d['days_left']} días)"
            if d["alerts"]:
                return "review", f"{d['product']}: {len(d['alerts'])} alerta{'s' if len(d['alerts']) > 1 else ''}", f"{d['insurer']} · {when}"
            return "done", f"{d['product']}: renovar", f"{d['insurer']} · {when}"
        if tool == "flag_issue":
            return "review", f"{KIND_TITLE.get(a['kind'], 'Incidencia')}: {a['title']}", a["detail"]
        if tool == "create_review_task":
            return "review", f"Tarea para tu equipo: {a['title']}", None
        if tool == "prepare_email_draft":
            return "done", "Correo preparado para tu aprobación", f"Para {d['to']} · no se ha enviado"
        if tool == "finalize_renewal":
            if d["totals"]:
                return "done", "Renovaciones listas para revisión", f"{d['policies']} pólizas · {eur(d['totals']['premium_at_risk'])} en riesgo"
            return "done", "Sin renovaciones que gestionar", "Ninguna póliza vence en el plazo"
        return "done", "Hecho", None

    def side_events(self, ctx: RunContext, tool: str, a: dict, d: dict) -> list[tuple[str, dict]]:
        out: list[tuple[str, dict]] = []
        if tool == "find_client" and d["status"] == "identified":
            out.append(("result", {"kind": "client", "data": d["client"]}))
        if tool == "open_renewal":
            out.append(("result", {"kind": "case", "data": {"case_id": d["renewal_id"], "period": d["period"], "period_label": period_label(d["period"])}}))
        if tool == "review_policy":
            out.append(("result", {"kind": "renewal_policy", "data": {
                "policy_id": d["policy_id"], "insurer": d["insurer"], "product": d["product"], "policy_number": d["policy_number"],
                "renewal_date": d["renewal_date"], "days_left": d["days_left"], "urgent": d["urgent"], "current_premium": d["current_premium"],
                "renewal_premium": d["renewal_premium"], "change_pct": d["change_pct"], "flags": d["flags"],
                "recommendation": d["recommendation"], "rationale": d["rationale"], "renewal_notes": d["renewal_notes"]}}))
            for al in d["alerts"]:
                out.append(("result", {"kind": "incident", "data": {"type": al["kind"], "title": al["title"], "text": al["detail"], "source": "Revisión de la póliza"}}))
        if tool == "flag_issue":
            out.append(("result", {"kind": "incident", "data": {
                "type": a["kind"], "title": a["title"], "text": a["detail"], "source": a.get("source_text") or "Solicitud"}}))
        if tool == "create_review_task":
            out.append(("result", {"kind": "task", "data": {"task_id": d["task_id"], "title": a["title"], "reason": a["reason"],
                                                            "priority": a["priority"], "attachment_id": None}}))
        if tool == "prepare_email_draft":
            draft = ctx.db.one("SELECT id, to_address, subject, body, status FROM email_drafts WHERE id=?", (d["draft_id"],))
            out.append(("result", {"kind": "draft", "data": draft}))
        if tool == "finalize_renewal":
            case = ctx.db.one("SELECT result FROM cases WHERE id=?", (ctx.case_id,))
            out.append(("result", {"kind": "summary", "data": json.loads(case["result"])}))
        return out
