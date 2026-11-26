"""Traduce las acciones del agente de presupuestos a lenguaje de negocio (sin términos técnicos)."""

from __future__ import annotations

from typing import Any

from app.events.presenter import Presenter, _business_error, eur, period_label
from app.tools.base import RunContext, ToolError

PHASES = [
    ("recepcion", "Recepción"),
    ("cliente", "Cliente"),
    ("analisis", "Análisis"),
    ("calculo", "Cálculo"),
    ("comunicacion", "Correo"),
    ("presupuesto", "Presupuesto"),
]
TOOL_PHASE = {
    "find_client": "cliente", "get_quote_rules": "analisis", "get_service_catalog": "analisis", "open_quote": "presupuesto",
    "add_quote_line": "analisis", "flag_issue": "analisis", "calculate_quote": "calculo",
    "create_review_task": "comunicacion", "prepare_email_draft": "comunicacion", "finalize_quote": "presupuesto",
}
QUOTE_ERRORS = {
    "unknown_service": "Ese servicio no está en el tarifario",
    "source_not_in_request": "La cita no aparece en la solicitud del cliente",
    "volume_required": "Falta el volumen que indica el cliente",
    "wrong_tier": "El volumen no corresponde a ese tramo de tarifa",
    "no_lines": "Todavía no hay líneas en el presupuesto",
    "empty_quote": "El presupuesto está vacío",
    "confidential": "El correo no puede incluir información interna",
    "missing_review_tasks": "Cada incidencia necesita una tarea para tu equipo",
    "no_case": "Falta abrir el presupuesto",
}
PLURAL = {"mes": "meses", "trimestre": "trimestres", "año": "años", "nómina": "nóminas", "servicio": "servicios", "declaración": "declaraciones"}
KIND_TITLE = {"servicio_no_tarifado": "Servicio fuera del tarifario", "dato_faltante": "Dato que falta", "instruccion_sospechosa": "Instrucción sospechosa",
              "cliente_nuevo": "Posible cliente nuevo", "descuento_solicitado": "Descuento solicitado", "margen_bajo": "Margen por debajo del mínimo"}


class QuotePresenter(Presenter):
    tool_phase = TOOL_PHASE
    phases = PHASES
    kpi_labels = {"processed": "Líneas del presupuesto", "incidents": "Pendientes de revisión", "actions": "Acciones realizadas", "time": "Tiempo recuperado"}

    def business_error(self, err: ToolError) -> str:
        return QUOTE_ERRORS.get(err.code) or _business_error(err)

    def refresh_metrics(self, ctx: RunContext) -> None:
        if not ctx.case_id:
            return
        m = self.metrics
        m["documents_total"] = 0
        m["documents_processed"] = ctx.db.one("SELECT count(*) AS n FROM quote_lines WHERE case_id=?", (ctx.case_id,))["n"]
        m["incidents"] = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (ctx.case_id,))["n"]
        saved = ctx.settings.quote_manual_minutes - ctx.settings.quote_review_minutes
        progress = 1.0 if ctx.finalized else min(0.9, m["actions"] / 12 * 0.9)
        m["minutes_saved"] = round(saved * progress, 1)
        ctx.bus.emit("metrics", dict(m))

    # -- textos ----------------------------------------------------------------
    def _service(self, ctx: RunContext, service_id: str | None) -> str:
        row = ctx.db.one("SELECT name FROM service_catalog WHERE id=?", (service_id,)) if service_id else None
        return f"«{row['name']}»" if row else "el servicio"

    def start_label(self, ctx: RunContext, tool: str, a: dict) -> str:
        return {
            "find_client": "Identificando al cliente",
            "get_quote_rules": "Consultando las condiciones de la gestoría",
            "get_service_catalog": "Consultando el tarifario",
            "open_quote": "Abriendo el presupuesto",
            "add_quote_line": f"Presupuestando {self._service(ctx, a.get('service_id'))}",
            "calculate_quote": "Calculando importes, descuentos e IVA",
            "flag_issue": "Revisando algo que requiere atención",
            "create_review_task": "Creando una tarea para tu equipo",
            "prepare_email_draft": "Preparando el correo para el cliente",
            "finalize_quote": "Generando el presupuesto",
        }.get(tool, "Procesando")

    def finish_label(self, ctx: RunContext, tool: str, a: dict, d: dict) -> tuple[str, str, str | None]:
        if tool == "find_client":
            if d["status"] == "identified":
                return "done", f"Cliente identificado: {d['client']['legal_name']}", f"Por {d['matched_by']}"
            return "review", "Remitente no registrado como cliente", "Se tratará como posible cliente nuevo"
        if tool == "get_quote_rules":
            return "done", f"{len(d['rules'])} condiciones internas aplicadas", None
        if tool == "get_service_catalog":
            return "done", "Tarifario consultado", f"{len(d['services'])} servicios con precio"
        if tool == "open_quote":
            return "done", f"Presupuesto {d['quote_id']} abierto", period_label(d["period"]).capitalize()
        if tool == "add_quote_line":
            qty = f"{d['quantity']:g}".replace(".", ",")
            unit = d["unit"] if float(d["quantity"]) == 1 else PLURAL.get(d["unit"], d["unit"])
            return "done", f"{d['name']}", f"{qty} {unit} × {eur(d['unit_price'])} = {eur(d['subtotal'])}"
        if tool == "calculate_quote":
            t, i = d["totals"], d["internal"]
            disc = f" · descuento por volumen {eur(t['discount'])}" if t["discount"] else ""
            if d["margin_below_minimum"]:
                return "review", f"Total calculado: {eur(t['total'])}", f"Base {eur(t['base'])} · IVA {eur(t['vat'])}{disc} · margen por debajo del mínimo"
            return "done", f"Total calculado: {eur(t['total'])}", f"Base {eur(t['base'])} · IVA {eur(t['vat'])}{disc}"
        if tool == "flag_issue":
            return "review", f"{KIND_TITLE.get(a['kind'], 'Incidencia')}: {a['title']}", a["detail"]
        if tool == "create_review_task":
            return "review", f"Tarea para tu equipo: {a['title']}", None
        if tool == "prepare_email_draft":
            return "done", "Correo preparado para tu aprobación", f"Para {d['to']} · no se ha enviado"
        if tool == "finalize_quote":
            if d["totals"]:
                return "done", "Presupuesto listo para revisión", f"{d['lines']} líneas · {eur(d['totals']['total'])}"
            return "review", "Presupuesto pendiente de información del cliente", "Falta algún dato imprescindible"
        return "done", "Hecho", None

    def side_events(self, ctx: RunContext, tool: str, a: dict, d: dict) -> list[tuple[str, dict]]:
        out: list[tuple[str, dict]] = []
        if tool == "find_client" and d["status"] == "identified":
            out.append(("result", {"kind": "client", "data": d["client"]}))
        if tool == "open_quote":
            out.append(("result", {"kind": "case", "data": {"case_id": d["quote_id"], "period": d["period"], "period_label": period_label(d["period"])}}))
        if tool == "add_quote_line":
            out.append(("result", {"kind": "quote_line", "data": d}))
        if tool == "calculate_quote":
            out.append(("result", {"kind": "quote_totals", "data": d["totals"]}))
            out.append(("result", {"kind": "quote_internal", "data": d["internal"]}))
            if d["margin_below_minimum"]:
                out.append(("result", {"kind": "incident", "data": {
                    "type": "margen_bajo", "title": KIND_TITLE["margen_bajo"],
                    "text": f"El margen es del {d['internal']['margin_pct']:g}% y el mínimo es el {d['internal']['min_margin_pct']:g}%.", "source": "Cálculo"}}))
        if tool == "flag_issue":
            out.append(("result", {"kind": "incident", "data": {
                "type": a["kind"], "title": a["title"], "text": a["detail"], "source": a.get("source_text") or "Solicitud del cliente"}}))
        if tool == "create_review_task":
            out.append(("result", {"kind": "task", "data": {"task_id": d["task_id"], "title": a["title"], "reason": a["reason"],
                                                            "priority": a["priority"], "attachment_id": None}}))
        if tool == "prepare_email_draft":
            draft = ctx.db.one("SELECT id, to_address, subject, body, status FROM email_drafts WHERE id=?", (d["draft_id"],))
            out.append(("result", {"kind": "draft", "data": draft}))
        if tool == "finalize_quote":
            import json
            case = ctx.db.one("SELECT result FROM cases WHERE id=?", (ctx.case_id,))
            out.append(("result", {"kind": "summary", "data": json.loads(case["result"])}))
        return out
