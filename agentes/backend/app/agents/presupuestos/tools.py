"""Herramientas del agente de presupuestos.

Los precios salen del tarifario y los totales los calcula el sistema: el modelo elige servicios y cantidades, nunca importes.
Integraciones locales (SQLite y ficheros); pensadas para sustituirse por un ERP o un CRM sin cambiar la interfaz del agente.
"""

from __future__ import annotations

import hashlib
import json
from datetime import date, timedelta
from typing import Literal

from pydantic import Field

from app.persistence.db import dumps
from app.tools import catalog as doc_tools
from app.tools.base import RunContext, ToolError, ToolOutcome, ToolSpec, new_id, now_iso
from app.tools.catalog import DraftIn, FindClientIn, LogEventIn, ReviewTaskIn, Strict
from app.validation import quotes as q

IssueKind = Literal["servicio_no_tarifado", "dato_faltante", "instruccion_sospechosa", "cliente_nuevo", "descuento_solicitado"]
FORBIDDEN_IN_DRAFT = ("margen", "coste interno", "costes internos", "nuestro coste", "horas estimadas")


class NoInput(Strict):
    pass


# -- consulta ---------------------------------------------------------------
def get_quote_rules(ctx: RunContext, a: NoInput) -> ToolOutcome:
    rules = ctx.db.all("SELECT code, title, body FROM quote_rules ORDER BY code")
    return ToolOutcome({"rules": rules, "valid_days": q.VALID_DAYS})


def get_service_catalog(ctx: RunContext, a: NoInput) -> ToolOutcome:
    rows = ctx.db.all("SELECT id, family, name, description, kind, unit, unit_price, tier_min, tier_max, tier_label "
                      "FROM service_catalog ORDER BY family, unit_price")
    services = []
    for r in rows:
        s = {"service_id": r["id"], "name": r["name"], "description": r["description"], "kind": r["kind"],
             "unit": r["unit"], "unit_price": r["unit_price"]}
        if r["tier_min"] is not None:
            s["applies_when"] = f"{r['tier_min']}–{r['tier_max']} {r['tier_label']}"
        services.append(s)
    return ToolOutcome({"services": services, "note": "Es el tarifario completo. Lo que no aparezca aquí no se puede presupuestar."})


# -- presupuesto -------------------------------------------------------------
class OpenQuoteIn(Strict):
    client_id: str | None = Field(None, description="Identificador del cliente, si se ha identificado.")


def open_quote(ctx: RunContext, a: OpenQuoteIn) -> ToolOutcome:
    email = ctx.email()
    existing = ctx.db.one("SELECT * FROM cases WHERE run_id=? AND email_id=?", (ctx.run_id, ctx.email_id))
    if existing:
        case_id, created = existing["id"], False
    else:
        if a.client_id and not ctx.db.one("SELECT id FROM clients WHERE id=?", (a.client_id,)):
            raise ToolError(f"No existe el cliente {a.client_id}.", "unknown_client")
        n = (ctx.db.one("SELECT count(*) AS n FROM cases WHERE id LIKE 'PRE-%'")["n"] or 0) + 1
        case_id = f"PRE-{email['period'].replace('-', '')}-{n:04d}"
        ctx.db.execute("INSERT INTO cases (id, run_id, email_id, client_id, period, status, opened_at) VALUES (?,?,?,?,?,?,?)",
                       (case_id, ctx.run_id, ctx.email_id, a.client_id, email["period"], "en_proceso", now_iso()))
        ctx.db.execute("UPDATE runs SET case_id=? WHERE id=?", (case_id, ctx.run_id))
        created = True
    ctx.case_id, ctx.period = case_id, email["period"]
    ctx.client_id = a.client_id or (existing or {}).get("client_id")
    return ToolOutcome({"quote_id": case_id, "created": created, "client_id": ctx.client_id, "period": email["period"]})


class AddLineIn(Strict):
    service_id: str = Field(description="Identificador del servicio del tarifario.")
    quantity: float = Field(gt=0, le=1000, description="Unidades del servicio (p. ej. 12 meses, 4 trimestres, 36 nóminas).")
    volume: int | None = Field(None, ge=0, le=100000, description="Solo para servicios con tramos: el volumen que el cliente indica (p. ej. facturas al mes).")
    source_text: str = Field(min_length=4, max_length=300, description="Fragmento literal de la solicitud del cliente que justifica esta línea.")


def add_quote_line(ctx: RunContext, a: AddLineIn) -> ToolOutcome:
    case_id = ctx.require_case()
    svc = ctx.db.one("SELECT * FROM service_catalog WHERE id=?", (a.service_id,))
    if not svc:
        ids = ", ".join(r["id"] for r in ctx.db.all("SELECT id FROM service_catalog"))
        raise ToolError(f"El servicio '{a.service_id}' no está en el tarifario. Servicios válidos: {ids}. "
                        "Si lo que pide el cliente no está en el tarifario, no se presupuesta: señálalo como incidencia.", "unknown_service")
    email = ctx.email()
    if not q.source_in_request(a.source_text, email["subject"], email["body"]):
        raise ToolError("El fragmento citado no aparece en la solicitud del cliente. Cita literalmente el texto que justifica la línea.",
                        "source_not_in_request")
    if svc["tier_min"] is not None:
        if a.volume is None:
            raise ToolError(f"Este servicio tiene tramos ({svc['tier_label']}). Indica el volumen que ha dicho el cliente; si no lo ha dicho, "
                            "no lo supongas: señálalo como dato que falta.", "volume_required")
        if not svc["tier_min"] <= a.volume <= svc["tier_max"]:
            tiers = ctx.db.all("SELECT id, tier_min, tier_max FROM service_catalog WHERE family=? ORDER BY tier_min", (svc["family"],))
            right = q.tier_for(a.volume, [{"id": t["id"], "tier_min": t["tier_min"], "tier_max": t["tier_max"]} for t in tiers])
            hint = f" Con {a.volume} {svc['tier_label']} corresponde '{right['id']}'." if right else f" {a.volume} {svc['tier_label']} supera el tarifario: señálalo como incidencia."
            raise ToolError(f"El volumen {a.volume} no está en el tramo de '{svc['id']}' ({svc['tier_min']}–{svc['tier_max']}).{hint}", "wrong_tier")
    subtotal = float(q.line_subtotal(svc["unit_price"], a.quantity))
    ctx.db.execute("INSERT OR REPLACE INTO quote_lines VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                   (case_id, svc["id"], svc["name"], svc["kind"], svc["family"], svc["unit"], a.quantity, svc["unit_price"],
                    subtotal, svc["est_hours"], a.source_text))
    return ToolOutcome({"service_id": svc["id"], "name": svc["name"], "kind": svc["kind"], "unit": svc["unit"], "quantity": a.quantity,
                        "unit_price": svc["unit_price"], "subtotal": subtotal, "source_text": a.source_text})


def _lines(ctx: RunContext) -> list[dict]:
    return ctx.db.all("SELECT * FROM quote_lines WHERE case_id=? ORDER BY rowid", (ctx.require_case(),))


def _auto_incident(ctx: RunContext, key: str, kind: str, title: str, detail: str) -> bool:
    n = ctx.db.execute("INSERT OR IGNORE INTO incidents VALUES (?,?,?,?,?,?,?,?)",
                       (ctx.case_id, key, kind, title, detail, None, "cálculo", now_iso()))
    return n > 0


def calculate_quote(ctx: RunContext, a: NoInput) -> ToolOutcome:
    lines = _lines(ctx)
    if not lines:
        raise ToolError("No hay ninguna línea en el presupuesto. Añade primero los servicios solicitados.", "no_lines")
    totals = q.compute_quote(lines)
    low_margin = totals["internal"]["below_min"]
    if low_margin:
        _auto_incident(ctx, "margin", "margen_bajo", "Margen por debajo del mínimo",
                       f"El margen es del {totals['internal']['margin_pct']}% y el mínimo es el {totals['internal']['min_margin_pct']}%.")
    return ToolOutcome({"totals": {k: v for k, v in totals.items() if k != "internal"}, "internal": totals["internal"],
                        "lines": len(lines), "margin_below_minimum": low_margin,
                        "note": "El margen y el coste interno son confidenciales: no los menciones al cliente."})


class FlagIssueIn(Strict):
    kind: IssueKind
    title: str = Field(max_length=140)
    detail: str = Field(max_length=500)
    source_text: str | None = Field(None, max_length=300, description="Fragmento literal de la solicitud que origina la incidencia, si lo hay.")


def flag_issue(ctx: RunContext, a: FlagIssueIn) -> ToolOutcome:
    case_id = ctx.require_case()
    if a.source_text:
        email = ctx.email()
        if not q.source_in_request(a.source_text, email["subject"], email["body"]):
            raise ToolError("El fragmento citado no aparece en la solicitud del cliente. Cita literalmente el texto.", "source_not_in_request")
    key = f"{a.kind}:{hashlib.sha1(a.title.casefold().encode()).hexdigest()[:8]}"
    created = ctx.db.execute("INSERT OR IGNORE INTO incidents VALUES (?,?,?,?,?,?,?,?)",
                             (case_id, key, a.kind, a.title, a.detail, None, a.source_text or "Solicitud del cliente", now_iso())) > 0
    return ToolOutcome({"flagged": True, "created": created, "kind": a.kind,
                        "next_step": "Crea una tarea de revisión para esta incidencia antes de cerrar el presupuesto."})


def prepare_email_draft(ctx: RunContext, a: DraftIn) -> ToolOutcome:
    text = (a.subject + " " + a.body).casefold()
    leaked = [w for w in FORBIDDEN_IN_DRAFT if w in text]
    if leaked:
        raise ToolError(f"El correo no puede mencionar información interna ({', '.join(leaked)}). Quítala y vuelve a prepararlo.", "confidential")
    return doc_tools.prepare_email_draft(ctx, a)


# -- cierre y documento ----------------------------------------------------------
class FinalizeQuoteIn(Strict):
    summary: str = Field(max_length=1500, description="Resumen breve del presupuesto para el empleado que lo revisará.")


def build_quote_result(ctx: RunContext) -> dict:
    case = ctx.db.one("SELECT * FROM cases WHERE id=?", (ctx.case_id,))
    client = ctx.db.one("SELECT legal_name, tax_id, address, city, contact_name, contact_email FROM clients WHERE id=?", (case["client_id"],)) if case["client_id"] else None
    lines = _lines(ctx)
    totals = q.compute_quote(lines) if lines else None
    incidents = ctx.db.all("SELECT kind, title, detail, source FROM incidents WHERE case_id=? ORDER BY rowid", (ctx.case_id,))
    tasks = ctx.db.all("SELECT id, title, reason, priority FROM review_tasks WHERE case_id=? ORDER BY rowid", (ctx.case_id,))
    draft = ctx.db.one("SELECT id, to_address, subject, body, status FROM email_drafts WHERE case_id=?", (ctx.case_id,))
    email = ctx.email()
    return {
        "quote_id": ctx.case_id, "period": case["period"], "client": client, "requester": {"name": email["from_name"], "email": email["from_address"]},
        "lines": [{"service_id": l["service_id"], "name": l["name"], "kind": l["kind"], "unit": l["unit"], "quantity": l["quantity"],
                   "unit_price": l["unit_price"], "subtotal": l["subtotal"], "source_text": l["source_text"]} for l in lines],
        "totals": {k: v for k, v in totals.items() if k != "internal"} if totals else None,
        "internal": totals["internal"] if totals else None,  # solo para la gestoría
        "valid_until": (date.fromisoformat(now_iso()[:10]) + timedelta(days=q.VALID_DAYS)).isoformat(),
        "incidents": incidents, "review_tasks": [{"task_id": t["id"], **{k: t[k] for k in ("title", "reason", "priority")}} for t in tasks],
        "email_draft": draft, "pdf_url": f"/api/quotes/{ctx.case_id}/pdf" if lines else None,
        "summary": case["summary"], "status": "listo_para_revision" if lines else "pendiente_de_informacion",
    }


def finalize_quote(ctx: RunContext, a: FinalizeQuoteIn) -> ToolOutcome:
    case_id = ctx.require_case()
    lines = _lines(ctx)
    n_inc = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (case_id,))["n"]
    n_tasks = ctx.db.one("SELECT count(*) AS n FROM review_tasks WHERE case_id=?", (case_id,))["n"]
    if not lines and not n_inc:
        raise ToolError("El presupuesto está vacío: añade las líneas solicitadas o señala qué falta como incidencia.", "empty_quote")
    if lines:
        # Los totales los fija el sistema con las líneas actuales: se recalculan siempre antes de cerrar.
        calculate_quote(ctx, NoInput())
        n_inc = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (case_id,))["n"]
    if n_tasks < n_inc:
        titles = [r["title"] for r in ctx.db.all("SELECT title FROM incidents WHERE case_id=?", (case_id,))]
        raise ToolError(f"Hay {n_inc} incidencias y solo {n_tasks} tareas de revisión. Cada incidencia necesita su tarea de revisión humana: "
                        + "; ".join(titles) + ".", "missing_review_tasks")
    ctx.db.execute("UPDATE cases SET status=?, closed_at=?, summary=? WHERE id=?",
                   ("listo_para_revision" if lines else "pendiente_de_informacion", now_iso(), a.summary, case_id))
    result = build_quote_result(ctx)
    if lines:
        from .pdf import render_quote_pdf
        render_quote_pdf(ctx.settings.quotes_dir / f"{case_id}.pdf", result, ctx.db.one("SELECT name, tax_id, city, email FROM firm LIMIT 1"))
    ctx.db.execute("UPDATE cases SET result=? WHERE id=?", (dumps(result), case_id))
    ctx.finalized = True
    return ToolOutcome({"quote_id": case_id, "status": result["status"], "totals": result["totals"], "lines": len(lines),
                        "incidents": len(result["incidents"]), "instruction": "Presupuesto cerrado. Termina aquí."})


TOOLS: list[ToolSpec] = [
    ToolSpec("find_client", "Busca al remitente en la base de clientes de la gestoría por correo, NIF o nombre.", FindClientIn, doc_tools.find_client),
    ToolSpec("get_quote_rules", "Reglas internas de la gestoría para presupuestar (IVA, descuentos, márgenes, confidencialidad).", NoInput, get_quote_rules),
    ToolSpec("get_service_catalog", "Tarifario completo de servicios de la gestoría con sus precios. Lo que no esté aquí no se puede presupuestar.", NoInput, get_service_catalog),
    ToolSpec("open_quote", "Abre el presupuesto de esta solicitud (con o sin cliente identificado).", OpenQuoteIn, open_quote, read_only=False),
    ToolSpec("add_quote_line", "Añade una línea al presupuesto: un servicio del tarifario con su cantidad y el fragmento literal de la solicitud que la justifica. El precio lo pone el sistema.",
             AddLineIn, add_quote_line, read_only=False),
    ToolSpec("calculate_quote", "Calcula base, descuento, IVA, total y margen del presupuesto con las líneas actuales.", NoInput, calculate_quote, read_only=False),
    ToolSpec("flag_issue", "Señala una incidencia: servicio fuera del tarifario, dato que falta, instrucción sospechosa, cliente nuevo o descuento solicitado.", FlagIssueIn, flag_issue, read_only=False),
    ToolSpec("create_review_task", "Crea una tarea para que un empleado revise algo. Obligatoria por cada incidencia señalada.", ReviewTaskIn, doc_tools.create_review_task, read_only=False),
    ToolSpec("prepare_email_draft", "Prepara el borrador de correo para el cliente. Nunca se envía sin aprobación humana. No puede mencionar márgenes ni costes internos.", DraftIn, prepare_email_draft, read_only=False),
    ToolSpec("log_event", "Anota en la traza de auditoría un hecho relevante.", LogEventIn, doc_tools.log_event, read_only=False),
    ToolSpec("finalize_quote", "Cierra el presupuesto: recalcula los totales y genera el documento. Requiere una tarea de revisión por cada incidencia.", FinalizeQuoteIn, finalize_quote, read_only=False),
]
