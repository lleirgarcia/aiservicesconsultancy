"""Traduce las acciones del agente auditor de facturas a lenguaje de negocio (sin términos técnicos)."""

from __future__ import annotations

import json

from app.events.presenter import Presenter, _business_error, eur, period_label
from app.tools.base import RunContext, ToolError
from app.validation import audit as av

PHASES = [
    ("recepcion", "Recepción"),
    ("cliente", "Cliente"),
    ("documentos", "Documentos"),
    ("cruce", "Cruce"),
    ("comunicacion", "Correo"),
    ("informe", "Informe"),
]
TOOL_PHASE = {
    "find_client": "cliente", "get_audit_rules": "documentos", "list_audit_documents": "documentos", "open_audit": "informe",
    "audit_invoice": "cruce", "flag_issue": "cruce", "create_review_task": "comunicacion",
    "prepare_email_draft": "comunicacion", "finalize_audit": "informe",
}
AUDIT_ERRORS = {
    "unknown_invoice": "Esa factura no es del proveedor que se audita",
    "unknown_supplier": "Ese proveedor no existe",
    "findings_require_review": "Con anomalías no se da por buena una factura",
    "unaudited_invoices": "Quedan facturas por auditar",
    "source_not_in_request": "La cita no aparece en la petición",
    "missing_review_tasks": "Cada incidencia necesita una tarea para tu equipo",
    "no_case": "Falta abrir la auditoría",
    "unknown_client": "Ese cliente no existe",
}
KIND_TITLE = {**av.KIND_TITLES, "dato_faltante": "Dato que falta", "instruccion_sospechosa": "Instrucción sospechosa",
              "cliente_nuevo": "Posible cliente nuevo", "proveedor_desconocido": "Proveedor no identificado"}
ACTION = {"pagar": "pagar", "retener_pago": "retener el pago", "reclamar_proveedor": "reclamar al proveedor"}


class AuditPresenter(Presenter):
    tool_phase = TOOL_PHASE
    phases = PHASES
    kpi_labels = {"processed": "Facturas auditadas", "incidents": "Anomalías y pendientes", "actions": "Acciones realizadas", "time": "Tiempo recuperado"}

    def business_error(self, err: ToolError) -> str:
        return AUDIT_ERRORS.get(err.code) or _business_error(err)

    def refresh_metrics(self, ctx: RunContext) -> None:
        if not ctx.case_id:
            return
        m = self.metrics
        m["documents_total"] = 0
        m["documents_processed"] = ctx.db.one("SELECT count(*) AS n FROM audit_reviews WHERE case_id=?", (ctx.case_id,))["n"]
        m["incidents"] = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (ctx.case_id,))["n"]
        saved = ctx.settings.audit_manual_minutes - ctx.settings.audit_review_minutes
        progress = 1.0 if ctx.finalized else min(0.9, m["actions"] / 14 * 0.9)
        m["minutes_saved"] = round(saved * progress, 1)
        ctx.bus.emit("metrics", dict(m))

    def _invoice(self, ctx: RunContext, invoice_id: str | None) -> str:
        row = ctx.db.one("SELECT number FROM audit_documents WHERE id=?", (invoice_id,)) if invoice_id else None
        return f"la factura {row['number']}" if row else "la factura"

    def start_label(self, ctx: RunContext, tool: str, a: dict) -> str:
        return {
            "find_client": "Identificando al cliente",
            "get_audit_rules": "Consultando los criterios de auditoría",
            "list_audit_documents": "Reuniendo facturas, pedidos y albaranes",
            "open_audit": "Abriendo la auditoría",
            "audit_invoice": f"Cruzando {self._invoice(ctx, a.get('invoice_id'))} con su pedido y su albarán",
            "flag_issue": "Revisando algo que requiere atención",
            "create_review_task": "Creando una tarea para tu equipo",
            "prepare_email_draft": "Preparando el correo para el cliente",
            "finalize_audit": "Cerrando la auditoría",
        }.get(tool, "Procesando")

    def finish_label(self, ctx: RunContext, tool: str, a: dict, d: dict) -> tuple[str, str, str | None]:
        if tool == "find_client":
            if d["status"] == "identified":
                return "done", f"Cliente identificado: {d['client']['legal_name']}", f"Por {d['matched_by']}"
            return "review", "Cliente no identificado", "Lo confirmará una persona del equipo"
        if tool == "get_audit_rules":
            return "done", f"{len(d['rules'])} criterios de auditoría aplicados", None
        if tool == "list_audit_documents":
            n = sum(len(s["invoices"]) for s in d["suppliers"])
            return "done", f"{n} facturas de {len(d['suppliers'])} proveedores consultadas", "Con sus pedidos y albaranes"
        if tool == "open_audit":
            return "done", f"Auditoría {d['audit_id']} abierta", f"{d['supplier_name']} · {period_label(d['period'])}"
        if tool == "audit_invoice":
            if d["findings"]:
                return "review", f"Factura {d['number']}: {len(d['findings'])} anomalía{'s' if len(d['findings']) > 1 else ''}", \
                    f"{eur(d['amount_at_risk'])} afectados · {ACTION[d['action']]}"
            return "done", f"Factura {d['number']}: cuadra con pedido y albarán", f"{eur(d['base'])} · se puede pagar"
        if tool == "flag_issue":
            return "review", f"{KIND_TITLE.get(a['kind'], 'Incidencia')}: {a['title']}", a["detail"]
        if tool == "create_review_task":
            return "review", f"Tarea para tu equipo: {a['title']}", None
        if tool == "prepare_email_draft":
            return "done", "Correo preparado para tu aprobación", f"Para {d['to']} · no se ha enviado"
        if tool == "finalize_audit":
            if d["totals"]:
                return "done", "Informe de auditoría listo para revisión", f"{d['invoices']} facturas · {eur(d['totals']['at_risk_base'])} afectados"
            return "done", "Sin facturas que auditar", "El proveedor no tiene facturas"
        return "done", "Hecho", None

    def side_events(self, ctx: RunContext, tool: str, a: dict, d: dict) -> list[tuple[str, dict]]:
        out: list[tuple[str, dict]] = []
        if tool == "find_client" and d["status"] == "identified":
            out.append(("result", {"kind": "client", "data": d["client"]}))
        if tool == "open_audit":
            out.append(("result", {"kind": "case", "data": {"case_id": d["audit_id"], "period": d["period"], "period_label": period_label(d["period"])}}))
        if tool == "audit_invoice":
            out.append(("result", {"kind": "audit_invoice", "data": {k: d[k] for k in ("invoice_id", "number", "date", "base", "total", "order_ref", "findings", "action", "rationale")}}))
            for f in d["findings"]:
                out.append(("result", {"kind": "incident", "data": {"type": f["kind"], "title": f"{av.KIND_TITLES[f['kind']]}: factura {d['number']}",
                                                                    "text": f["detail"], "source": "Cruce con pedido y albarán"}}))
        if tool == "flag_issue":
            out.append(("result", {"kind": "incident", "data": {"type": a["kind"], "title": a["title"], "text": a["detail"], "source": a.get("source_text") or "Petición"}}))
        if tool == "create_review_task":
            out.append(("result", {"kind": "task", "data": {"task_id": d["task_id"], "title": a["title"], "reason": a["reason"], "priority": a["priority"], "attachment_id": None}}))
        if tool == "prepare_email_draft":
            draft = ctx.db.one("SELECT id, to_address, subject, body, status FROM email_drafts WHERE id=?", (d["draft_id"],))
            out.append(("result", {"kind": "draft", "data": draft}))
        if tool == "finalize_audit":
            case = ctx.db.one("SELECT result FROM cases WHERE id=?", (ctx.case_id,))
            out.append(("result", {"kind": "summary", "data": json.loads(case["result"])}))
        return out
