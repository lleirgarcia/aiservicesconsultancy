"""Traduce cada acción del agente a lenguaje de negocio para la interfaz.

Reglas: solo acciones y resultados verificables. Nunca razonamientos del modelo,
nombres de herramientas, JSON ni términos técnicos.
"""

from __future__ import annotations

from typing import Any

from app.seed.dataset import CATEGORY_LABELS
from app.tools.base import RunContext, ToolError

MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

PHASES = [
    ("recepcion", "Recepción"),
    ("cliente", "Cliente"),
    ("lectura", "Lectura"),
    ("validacion", "Control"),
    ("comunicacion", "Correo"),
    ("expediente", "Expediente"),
]

TOOL_PHASE = {
    "find_client": "cliente", "get_client_tax_profile": "cliente", "get_internal_rules": "expediente", "open_case": "expediente",
    "read_document": "lectura", "submit_extraction": "lectura",
    "get_document_history": "validacion", "find_similar_invoices": "validacion", "check_duplicates": "validacion",
    "get_recurring_patterns": "validacion", "register_document": "expediente", "create_review_task": "comunicacion",
    "prepare_email_draft": "comunicacion", "finalize_case": "expediente",
}
HIDDEN_TOOLS = {"log_event"}



def eur(x: float | None) -> str:
    if x is None:
        return "—"
    s = f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{s} €"


def period_label(period: str) -> str:
    y, m = period.split("-")
    return f"{MONTHS[int(m) - 1]} {y}"


def _att(ctx: RunContext, attachment_id: str | None) -> dict | None:
    if not attachment_id:
        return None
    return ctx.db.one("SELECT id, filename, position FROM attachments WHERE id=? AND email_id=?", (attachment_id, ctx.email_id))


def _fname(ctx: RunContext, attachment_id: str | None) -> str:
    a = _att(ctx, attachment_id)
    return f"«{a['filename']}»" if a else "el documento"


class Presenter:
    """Presentador del agente de gestión documental. Otros agentes lo heredan y sustituyen los textos y las fases."""

    tool_phase = TOOL_PHASE
    phases = PHASES
    hidden_tools = HIDDEN_TOOLS
    kpi_labels = {"processed": "Documentos procesados", "incidents": "Incidencias detectadas", "actions": "Acciones realizadas", "time": "Tiempo recuperado"}

    def business_error(self, err: ToolError) -> str:
        return _business_error(err)

    def __init__(self) -> None:
        self.metrics = {"documents_processed": 0, "documents_total": 0, "incidents": 0, "actions": 0, "minutes_saved": 0.0}

    # -- ciclo de vida de una acción -------------------------------------------
    def on_start(self, ctx: RunContext, tool: str, args: Any, activity_id: str) -> None:
        if tool in self.hidden_tools:
            return
        a = args.model_dump(mode="json")
        label = self.start_label(ctx, tool, a)
        ctx.bus.emit("activity_started", {"id": activity_id, "phase": self.tool_phase.get(tool, "expediente"), "label": label,
                                          "attachment_id": a.get("attachment_id")})
        doc_status = {"read_document": "reading", "submit_extraction": "extracting", "check_duplicates": "checking"}.get(tool)
        if doc_status and a.get("attachment_id"):
            ctx.bus.emit("document_status", {"attachment_id": a["attachment_id"], "status": doc_status})

    def on_finish(self, ctx: RunContext, tool: str, args: Any, data: dict, activity_id: str, duration_ms: int) -> None:
        if tool in self.hidden_tools:
            return
        a = args.model_dump(mode="json")
        status, label, detail = self.finish_label(ctx, tool, a, data)
        ctx.bus.emit("activity_finished", {"id": activity_id, "status": status, "label": label, "detail": detail,
                                           "duration_ms": duration_ms, "attachment_id": a.get("attachment_id")})
        for type_, payload in self.side_events(ctx, tool, a, data):
            ctx.bus.emit(type_, payload)
        self.metrics["actions"] += 1
        self.refresh_metrics(ctx)

    def on_error(self, ctx: RunContext, tool: str, args: Any, err: ToolError, activity_id: str, started: bool) -> None:
        if tool in self.hidden_tools:
            return
        a = args.model_dump(mode="json") if hasattr(args, "model_dump") else dict(args)
        if not started:
            ctx.bus.emit("activity_started", {"id": activity_id, "phase": self.tool_phase.get(tool, "expediente"),
                                              "label": self.start_label(ctx, tool, a), "attachment_id": a.get("attachment_id")})
        # Los errores esperados se muestran como "requiere revisión" o "error" con texto de negocio.
        transient = err.code in ("transient", "internal")
        ctx.bus.emit("activity_finished", {
            "id": activity_id, "status": "error" if transient else "review",
            "label": "Servicio no disponible momentáneamente · se reintenta" if transient else "Control de calidad aplicado",
            "detail": None if transient else self.business_error(err), "attachment_id": a.get("attachment_id"),
        })

    def refresh_metrics(self, ctx: RunContext) -> None:
        if not ctx.case_id:
            return
        m = self.metrics
        m["documents_total"] = len(ctx.attachments())
        m["documents_processed"] = ctx.db.one("SELECT count(*) AS n FROM case_documents WHERE case_id=?", (ctx.case_id,))["n"]
        m["incidents"] = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (ctx.case_id,))["n"]
        # Estimación: (minutos manuales − minutos de revisión) × fracción del expediente ya resuelta.
        saved = ctx.settings.manual_minutes - ctx.settings.review_minutes
        progress = 1.0 if ctx.finalized else (m["documents_processed"] / m["documents_total"] * 0.9 if m["documents_total"] else 0)
        m["minutes_saved"] = round(saved * progress, 1)
        ctx.bus.emit("metrics", dict(m))

    # -- textos ----------------------------------------------------------------
    def start_label(self, ctx: RunContext, tool: str, a: dict) -> str:
        f = _fname(ctx, a.get("attachment_id"))
        return {
            "find_client": "Identificando al cliente",
            "get_client_tax_profile": "Consultando los datos fiscales del cliente",
            "get_internal_rules": "Consultando los procedimientos de la gestoría",
            "open_case": "Abriendo el expediente",
            "read_document": f"Leyendo {f}",
            "submit_extraction": f"Extrayendo la información económica de {f}",
            "get_document_history": "Consultando la documentación histórica",
            "find_similar_invoices": f"Buscando facturas similares a {f}",
            "check_duplicates": f"Comprobando posibles duplicidades de {f}",
            "get_recurring_patterns": "Revisando la documentación recurrente",
            "register_document": f"Archivando {f}",
            "create_review_task": "Creando una tarea para tu equipo",
            "prepare_email_draft": "Preparando el correo para el cliente",
            "finalize_case": "Organizando el expediente",
        }.get(tool, "Procesando")

    def finish_label(self, ctx: RunContext, tool: str, a: dict, d: dict) -> tuple[str, str, str | None]:
        f = _fname(ctx, a.get("attachment_id"))
        if tool == "find_client":
            if d["status"] == "identified":
                return "done", f"Cliente identificado: {d['client']['legal_name']}", f"Por {d['matched_by']}"
            return "review", "Remitente no registrado como cliente", "Lo confirmará una persona del equipo"
        if tool == "get_client_tax_profile":
            ok = d["tax_id_check"]["valid"]
            return ("done" if ok else "review"), f"NIF {d['client']['tax_id']} {'verificado' if ok else 'no válido'}", \
                f"IVA {d['vat_regime'].lower()} · declaración {d['vat_filing'].lower()} · {len(d['usual_suppliers'])} proveedores habituales"
        if tool == "get_internal_rules":
            return "done", f"{len(d['rules'])} procedimientos internos aplicados", None
        if tool == "open_case":
            return "done", f"Expediente {d['case_id']} abierto", f"{period_label(d['period']).capitalize()} · {len(d['attachments'])} documentos"
        if tool == "read_document":
            kind = "PDF" if d["format"] == "pdf_text" else "imagen"
            if d["legibility"] == "baja":
                return "review", f"{f} es una imagen poco legible", "No se deducirá ningún dato que no se lea con seguridad"
            return "done", f"{f} leído", f"{kind} · {d['pages']} página{'s' if d['pages'] > 1 else ''}"
        if tool == "submit_extraction":
            cat = CATEGORY_LABELS.get(a.get("category"), "Documento")
            if not d["valid"]:
                first = next((i["message"] for i in d["issues"] if i["blocking"]), "Datos incompletos")
                return "review", f"{cat}: datos por confirmar", first
            return "done", f"{cat} · {a.get('issuer_name') or 'emisor'} · {eur(a.get('total_amount'))}", \
                f"NIF del emisor válido · importes cuadran{' · proveedor habitual' if d['known_supplier'] else ''}"
        if tool == "get_document_history":
            return "done", f"{d['document_count']} documentos de los últimos {len(d['periods'])} meses consultados", None
        if tool == "find_similar_invoices":
            n = d["history_match_count"]
            return "done", (f"{n} facturas similares en meses anteriores" if n else "Sin facturas similares en el histórico"), None
        if tool == "check_duplicates":
            if d["is_duplicate"]:
                dup = d["duplicate_of"]
                ref = f"«{dup['filename']}»" if dup.get("filename") else f"la factura {dup.get('invoice_number')} ya contabilizada"
                return "review", f"Factura duplicada detectada: {f}", f"Es copia de {ref} · {d['criterion']} · no se contabilizará"
            if d["copies_of_this_document"]:
                return "done", f"{f} es el original", "Se ha recibido otra copia en este mismo correo"
            if not d["complete"]:
                return "done", "Comprobación parcial: faltan documentos por leer", None
            return "done", f"{f} sin duplicidades", "Ni en el histórico ni en este correo"
        if tool == "get_recurring_patterns":
            missing = d["expected_not_received"]
            if missing and d["definitive"]:
                names = ", ".join(CATEGORY_LABELS.get(p["category"], p["category"]).lower() for p in missing)
                return "review", f"Posible documentación pendiente: {names}", \
                    "; ".join(f"{p['supplier_name']} factura {p['months_seen_count']} de los últimos {p['lookback_months']} meses" for p in missing)
            if not d["definitive"]:
                return "done", "Revisión provisional: faltan documentos por leer", None
            return "done", f"{len(d['monthly_patterns'])} proveedores mensuales: todo recibido", None
        if tool == "register_document":
            if d["status"] == "duplicate":
                return "done", f"{f} archivado como duplicado", "No se contabiliza"
            if d["status"] == "needs_review":
                return "review", f"{f} apartado para revisión", d["folder"]
            return "done", f"{f} archivado", d["folder"]
        if tool == "create_review_task":
            return "review", f"Tarea para tu equipo: {a['title']}", None
        if tool == "prepare_email_draft":
            return "done", "Correo preparado para tu aprobación", f"Para {d['to']} · no se ha enviado"
        if tool == "finalize_case":
            return "done", "Expediente listo para revisión", f"{d['valid_count']} facturas válidas · {eur(d['totals']['total'])}"
        return "done", "Hecho", None

    # -- resultados parciales para la columna derecha -----------------------------
    def side_events(self, ctx: RunContext, tool: str, a: dict, d: dict) -> list[tuple[str, dict]]:
        out: list[tuple[str, dict]] = []
        if tool == "find_client" and d["status"] == "identified":
            out.append(("result", {"kind": "client", "data": d["client"]}))
        if tool == "open_case":
            out.append(("result", {"kind": "case", "data": {"case_id": d["case_id"], "period": d["period"], "period_label": period_label(d["period"])}}))
        if tool == "read_document":
            out.append(("document_status", {"attachment_id": a["attachment_id"], "status": "review" if d["legibility"] == "baja" else "read"}))
        if tool == "submit_extraction":
            summary = {"category": a.get("category"), "category_label": CATEGORY_LABELS.get(a.get("category")), "issuer_name": a.get("issuer_name"),
                       "invoice_number": a.get("invoice_number"), "issue_date": a.get("issue_date"), "total_amount": a.get("total_amount"),
                       "base_amount": a.get("base_amount"), "vat_amount": a.get("vat_amount"), "valid": d["valid"]}
            out.append(("document_status", {"attachment_id": a["attachment_id"], "status": "extracted" if d["valid"] else "review", "summary": summary}))
        if tool == "check_duplicates" and d["is_duplicate"]:
            dup = d["duplicate_of"]
            out.append(("document_status", {"attachment_id": a["attachment_id"], "status": "duplicate"}))
            out.append(("result", {"kind": "incident", "data": {
                "type": "duplicado", "title": "Factura duplicada", "attachment_id": a["attachment_id"],
                "text": f"{_fname(ctx, a['attachment_id'])} es copia de " + (f"«{dup['filename']}»" if dup.get("filename") else f"la factura {dup.get('invoice_number')}"),
                "source": d["criterion"]}}))
        if tool == "get_recurring_patterns" and d["definitive"]:
            for p in d["expected_not_received"]:
                out.append(("result", {"kind": "incident", "data": {
                    "type": "pendiente", "title": f"Posible factura pendiente: {CATEGORY_LABELS.get(p['category'], p['category']).lower()}",
                    "text": f"{p['supplier_name']} factura cada mes ({p['months_seen_count']} de los últimos {p['lookback_months']}). "
                            f"Última: {p['last_invoice_number']} · media {eur(p['average_total'])}.",
                    "source": "Histórico de los últimos 6 meses"}}))
        if tool == "register_document":
            ex = ctx.latest_extraction(a["attachment_id"])
            data = (ex or {}).get("data", {})
            out.append(("document_status", {"attachment_id": a["attachment_id"], "status": {"valid": "valid", "duplicate": "duplicate", "needs_review": "review"}[d["status"]]}))
            out.append(("result", {"kind": "document", "data": {
                "attachment_id": a["attachment_id"], "filename": (_att(ctx, a["attachment_id"]) or {}).get("filename"), "status": d["status"],
                "category_label": CATEGORY_LABELS.get(a["category"]), "folder": d["folder"], "issuer_name": data.get("issuer_name"),
                "issuer_tax_id": data.get("issuer_tax_id"), "invoice_number": data.get("invoice_number"), "issue_date": data.get("issue_date"),
                "base_amount": data.get("base_amount"), "vat_amount": data.get("vat_amount"), "total_amount": data.get("total_amount")}}))
            if d["status"] == "needs_review":
                out.append(("result", {"kind": "incident", "data": {
                    "type": "revision", "title": "Documento a revisar", "attachment_id": a["attachment_id"],
                    "text": f"{_fname(ctx, a['attachment_id'])} no se ha podido validar automáticamente.", "source": "Validación"}}))
        if tool == "create_review_task":
            out.append(("result", {"kind": "task", "data": {"task_id": d["task_id"], "title": a["title"], "reason": a["reason"],
                                                            "priority": a["priority"], "attachment_id": a.get("attachment_id")}}))
        if tool == "prepare_email_draft":
            draft = ctx.db.one("SELECT id, to_address, subject, body, status FROM email_drafts WHERE id=?", (d["draft_id"],))
            out.append(("result", {"kind": "draft", "data": draft}))
        if tool == "finalize_case":
            case = ctx.db.one("SELECT result FROM cases WHERE id=?", (ctx.case_id,))
            import json
            out.append(("result", {"kind": "summary", "data": json.loads(case["result"])}))
        return out


def _business_error(err: ToolError) -> str:
    return {
        "blocking_issues": "Un documento con datos sin cuadrar no se da por válido",
        "duplicates_not_checked": "Antes de archivar hay que comprobar duplicidades",
        "is_duplicate": "Un duplicado no se contabiliza",
        "not_duplicate": "Solo se marca como duplicado lo confirmado",
        "unregistered": "Quedan documentos por archivar",
        "missing_review_tasks": "Cada incidencia necesita una tarea para tu equipo",
        "no_extraction": "Falta leer el documento",
        "no_case": "Falta abrir el expediente",
        "max_attempts": "Se deriva a revisión humana",
        "invalid_input": "Datos incompletos",
    }.get(err.code, "Se reintenta")
