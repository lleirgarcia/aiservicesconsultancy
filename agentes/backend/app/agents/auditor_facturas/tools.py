"""Herramientas del agente auditor de facturas.

El cruce de cada factura con su pedido y sus albaranes, y el importe afectado, lo calcula el sistema.
El modelo elige proveedor, decide qué hacer con cada factura y redacta; no puede dar por buena una factura con anomalías.
Integraciones locales (SQLite); pensadas para sustituirse por el programa de contabilidad o el ERP.
"""

from __future__ import annotations

import hashlib
import json
from typing import Literal

from pydantic import Field

from app.persistence.db import dumps
from app.tools import catalog as doc_tools
from app.tools.base import RunContext, ToolError, ToolOutcome, ToolSpec, now_iso
from app.tools.catalog import DraftIn, FindClientIn, LogEventIn, ReviewTaskIn, Strict
from app.validation import audit as av
from app.validation import quotes as qv

IssueKind = Literal["dato_faltante", "instruccion_sospechosa", "cliente_nuevo", "proveedor_desconocido"]
Action = Literal["pagar", "retener_pago", "reclamar_proveedor"]


class NoInput(Strict):
    pass


def get_audit_rules(ctx: RunContext, a: NoInput) -> ToolOutcome:
    return ToolOutcome({"rules": ctx.db.all("SELECT code, title, body FROM audit_rules ORDER BY code")})


class ClientIn(Strict):
    client_id: str = Field(description="Identificador del cliente.")


def list_audit_documents(ctx: RunContext, a: ClientIn) -> ToolOutcome:
    if not ctx.db.one("SELECT id FROM clients WHERE id=?", (a.client_id,)):
        raise ToolError(f"No existe el cliente {a.client_id}.", "unknown_client")
    rows = ctx.db.all("SELECT d.*, s.name AS supplier_name FROM audit_documents d JOIN suppliers s ON s.id=d.supplier_id "
                      "WHERE d.client_id=? ORDER BY d.supplier_id, d.doc_date, d.id", (a.client_id,))
    suppliers: dict[str, dict] = {}
    for r in rows:
        s = suppliers.setdefault(r["supplier_id"], {"supplier_id": r["supplier_id"], "supplier_name": r["supplier_name"], "invoices": [], "orders": 0, "delivery_notes": 0})
        if r["kind"] == "factura":
            s["invoices"].append({"invoice_id": r["id"], "number": r["number"], "date": r["doc_date"], "base": r["base"], "total": r["total"], "order_ref": r["po_ref"]})
        elif r["kind"] == "pedido":
            s["orders"] += 1
        else:
            s["delivery_notes"] += 1
    return ToolOutcome({"suppliers": list(suppliers.values()),
                        "note": "Solo se listan los documentos. Las anomalías las calcula el sistema al auditar cada factura."})


class OpenAuditIn(Strict):
    client_id: str | None = Field(None, description="Identificador del cliente, si se ha identificado.")
    supplier_id: str = Field(description="Identificador del proveedor cuyas facturas se auditan (el que pide la petición).")


def open_audit(ctx: RunContext, a: OpenAuditIn) -> ToolOutcome:
    email = ctx.email()
    existing = ctx.db.one("SELECT * FROM cases WHERE run_id=? AND email_id=?", (ctx.run_id, ctx.email_id))
    sup = ctx.db.one("SELECT id, name FROM suppliers WHERE id=?", (a.supplier_id,))
    if not sup:
        raise ToolError(f"No existe el proveedor {a.supplier_id}.", "unknown_supplier")
    if existing:
        case_id, created = existing["id"], False
    else:
        if a.client_id and not ctx.db.one("SELECT id FROM clients WHERE id=?", (a.client_id,)):
            raise ToolError(f"No existe el cliente {a.client_id}.", "unknown_client")
        n = (ctx.db.one("SELECT count(*) AS n FROM cases WHERE id LIKE 'AUD-%'")["n"] or 0) + 1
        case_id = f"AUD-{email['period'].replace('-', '')}-{n:04d}"
        ctx.db.execute("INSERT INTO cases (id, run_id, email_id, client_id, period, status, opened_at) VALUES (?,?,?,?,?,?,?)",
                       (case_id, ctx.run_id, ctx.email_id, a.client_id, email["period"], "en_proceso", now_iso()))
        ctx.db.execute("UPDATE runs SET case_id=? WHERE id=?", (case_id, ctx.run_id))
        created = True
    ctx.case_id, ctx.period = case_id, email["period"]
    ctx.client_id = a.client_id or (existing or {}).get("client_id")
    ctx.audit_supplier = sup["id"]  # type: ignore[attr-defined]
    return ToolOutcome({"audit_id": case_id, "created": created, "client_id": ctx.client_id, "supplier_id": sup["id"],
                        "supplier_name": sup["name"], "period": email["period"]})


def _scope_invoices(ctx: RunContext) -> list[dict]:
    sup = getattr(ctx, "audit_supplier", None)
    if not ctx.client_id or not sup:
        return []
    return ctx.db.all("SELECT * FROM audit_documents WHERE kind='factura' AND client_id=? AND supplier_id=? ORDER BY doc_date, id", (ctx.client_id, sup))


def _check(ctx: RunContext, inv: dict) -> list[dict]:
    lines = ctx.db.all("SELECT item_code, description, quantity, unit_price FROM audit_lines WHERE doc_id=? ORDER BY rowid", (inv["id"],))
    dup = next((r for r in ctx.db.all("SELECT id, number, doc_date FROM audit_documents WHERE kind='factura' AND client_id=? AND supplier_id=? AND id<>?",
                                      (inv["client_id"], inv["supplier_id"], inv["id"]))
                if av.norm_number(r["number"]) == av.norm_number(inv["number"]) and (r["doc_date"], r["id"]) < (inv["doc_date"], inv["id"])), None)
    order = ctx.db.one("SELECT id FROM audit_documents WHERE id=? AND kind='pedido'", (inv["po_ref"],)) if inv["po_ref"] else None
    order_lines = ctx.db.all("SELECT item_code, unit_price, quantity FROM audit_lines WHERE doc_id=?", (order["id"],)) if order else None
    delivered: dict[str, float] = {}
    if order:
        for r in ctx.db.all("SELECT l.item_code, l.quantity FROM audit_lines l JOIN audit_documents d ON d.id=l.doc_id WHERE d.kind='albaran' AND d.po_ref=?", (order["id"],)):
            delivered[r["item_code"]] = delivered.get(r["item_code"], 0) + r["quantity"]
    return av.match_invoice(inv, lines, order_lines, delivered, dup["number"] + f" ({dup['doc_date']})" if dup else None)


class AuditInvoiceIn(Strict):
    invoice_id: str = Field(description="Identificador de la factura del proveedor auditado.")
    action: Action = Field(description="Qué hacer con la factura: pagar, retener el pago o reclamar al proveedor. Con anomalías no se puede «pagar».")
    rationale: str = Field(min_length=8, max_length=300, description="Motivo breve, basado en el resultado del cruce.")


def audit_invoice(ctx: RunContext, a: AuditInvoiceIn) -> ToolOutcome:
    case_id = ctx.require_case()
    inv = ctx.db.one("SELECT * FROM audit_documents WHERE id=? AND kind='factura'", (a.invoice_id,))
    scope = {i["id"] for i in _scope_invoices(ctx)}
    if not inv or inv["id"] not in scope:
        raise ToolError(f"La factura '{a.invoice_id}' no es del cliente y proveedor que se auditan. Facturas válidas: {', '.join(sorted(scope)) or '(ninguna)'}.", "unknown_invoice")
    findings = _check(ctx, inv)
    if findings and a.action == "pagar":
        raise ToolError("Esta factura tiene anomalías (" + ", ".join(av.KIND_TITLES[f["kind"]].lower() for f in findings) + "): no se puede recomendar «pagar». "
                        "Retén el pago o reclama al proveedor y deja la tarea para una persona.", "findings_require_review")
    ctx.db.execute("INSERT OR REPLACE INTO audit_reviews VALUES (?,?,?,?,?)", (case_id, inv["id"], a.action, a.rationale, json.dumps(findings)))
    for f in findings:
        ctx.db.execute("INSERT OR IGNORE INTO incidents VALUES (?,?,?,?,?,?,?,?)",
                       (case_id, f"{inv['id']}:{f['kind']}:{f['item_code']}", f["kind"], f"{av.KIND_TITLES[f['kind']]}: factura {inv['number']}", f["detail"],
                        None, "Cruce con pedido y albarán", now_iso()))
    return ToolOutcome({"invoice_id": inv["id"], "number": inv["number"], "date": inv["doc_date"], "base": inv["base"], "total": inv["total"],
                        "order_ref": inv["po_ref"], "findings": findings, "action": a.action, "rationale": a.rationale,
                        "amount_at_risk": float(sum((av.money(f["amount"]) for f in findings), 0))})


class FlagIssueIn(Strict):
    kind: IssueKind
    title: str = Field(max_length=140)
    detail: str = Field(max_length=500)
    source_text: str | None = Field(None, max_length=300, description="Fragmento literal de la petición que origina la incidencia, si lo hay.")


def flag_issue(ctx: RunContext, a: FlagIssueIn) -> ToolOutcome:
    case_id = ctx.require_case()
    if a.source_text:
        email = ctx.email()
        if not qv.source_in_request(a.source_text, email["subject"], email["body"]):
            raise ToolError("El fragmento citado no aparece en la petición. Cita literalmente el texto.", "source_not_in_request")
    key = f"{a.kind}:{hashlib.sha1(a.title.casefold().encode()).hexdigest()[:8]}"
    created = ctx.db.execute("INSERT OR IGNORE INTO incidents VALUES (?,?,?,?,?,?,?,?)",
                             (case_id, key, a.kind, a.title, a.detail, None, a.source_text or "Petición", now_iso())) > 0
    return ToolOutcome({"flagged": True, "created": created, "kind": a.kind,
                        "next_step": "Crea una tarea de revisión para esta incidencia antes de cerrar la auditoría."})


class FinalizeIn(Strict):
    summary: str = Field(max_length=1500, description="Resumen breve de la auditoría para el empleado que la validará.")


def _reviews(ctx: RunContext) -> list[dict]:
    rows = ctx.db.all("SELECT r.*, d.number, d.doc_date, d.base, d.vat, d.total, d.po_ref FROM audit_reviews r JOIN audit_documents d ON d.id=r.invoice_id "
                      "WHERE r.case_id=? ORDER BY d.doc_date, d.id", (ctx.require_case(),))
    for r in rows:
        r["findings"] = json.loads(r["findings"])
    return rows


def build_audit_result(ctx: RunContext) -> dict:
    case = ctx.db.one("SELECT * FROM cases WHERE id=?", (ctx.case_id,))
    client = ctx.db.one("SELECT legal_name, tax_id, contact_name, contact_email FROM clients WHERE id=?", (case["client_id"],)) if case["client_id"] else None
    sup = ctx.db.one("SELECT name, tax_id FROM suppliers WHERE id=?", (getattr(ctx, "audit_supplier", None),))
    reviews = _reviews(ctx)
    invoices = [{"invoice_id": r["invoice_id"], "number": r["number"], "date": r["doc_date"], "base": r["base"], "total": r["total"],
                 "order_ref": r["po_ref"], "findings": r["findings"], "action": r["action"], "rationale": r["rationale"]} for r in reviews]
    totals = av.compute_audit(reviews) if reviews else None
    incidents = ctx.db.all("SELECT kind, title, detail, source FROM incidents WHERE case_id=? ORDER BY rowid", (ctx.case_id,))
    tasks = ctx.db.all("SELECT id, title, reason, priority FROM review_tasks WHERE case_id=? ORDER BY rowid", (ctx.case_id,))
    draft = ctx.db.one("SELECT id, to_address, subject, body, status FROM email_drafts WHERE case_id=?", (ctx.case_id,))
    email = ctx.email()
    return {"audit_id": ctx.case_id, "period": case["period"], "client": client, "supplier": sup,
            "requester": {"name": email["from_name"], "email": email["from_address"]},
            "invoices": invoices, "totals": totals, "incidents": incidents,
            "review_tasks": [{"task_id": t["id"], **{k: t[k] for k in ("title", "reason", "priority")}} for t in tasks],
            "email_draft": draft, "summary": case["summary"], "status": "listo_para_revision" if invoices else "sin_facturas"}


def finalize_audit(ctx: RunContext, a: FinalizeIn) -> ToolOutcome:
    case_id = ctx.require_case()
    done = {r["invoice_id"] for r in _reviews(ctx)}
    missing = [i for i in _scope_invoices(ctx) if i["id"] not in done]
    if missing:
        raise ToolError("Quedan facturas del proveedor sin auditar: " + ", ".join(f"{i['id']} ({i['number']})" for i in missing) + ". Audítalas antes de cerrar.", "unaudited_invoices")
    n_inc = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (case_id,))["n"]
    n_tasks = ctx.db.one("SELECT count(*) AS n FROM review_tasks WHERE case_id=?", (case_id,))["n"]
    if n_tasks < n_inc:
        titles = [r["title"] for r in ctx.db.all("SELECT title FROM incidents WHERE case_id=?", (case_id,))]
        raise ToolError(f"Hay {n_inc} incidencias y solo {n_tasks} tareas de revisión. Cada incidencia necesita su tarea de revisión humana: " + "; ".join(titles) + ".", "missing_review_tasks")
    ctx.db.execute("UPDATE cases SET status=?, closed_at=?, summary=? WHERE id=?", ("listo_para_revision" if done else "sin_facturas", now_iso(), a.summary, case_id))
    result = build_audit_result(ctx)
    ctx.db.execute("UPDATE cases SET result=? WHERE id=?", (dumps(result), case_id))
    ctx.finalized = True
    return ToolOutcome({"audit_id": case_id, "status": result["status"], "totals": result["totals"], "invoices": len(result["invoices"]),
                        "incidents": len(result["incidents"]), "instruction": "Auditoría cerrada. Termina aquí."})


TOOLS: list[ToolSpec] = [
    ToolSpec("find_client", "Busca al cliente en la base de la gestoría por NIF, correo o nombre.", FindClientIn, doc_tools.find_client),
    ToolSpec("get_audit_rules", "Reglas internas de auditoría de facturas (cruce, duplicadas, precios, cantidades, IVA, qué hacer).", NoInput, get_audit_rules),
    ToolSpec("list_audit_documents", "Facturas, pedidos y albaranes del cliente agrupados por proveedor. No incluye las anomalías: las calcula el sistema al auditar.", ClientIn, list_audit_documents),
    ToolSpec("open_audit", "Abre la auditoría de las facturas de un proveedor de este cliente.", OpenAuditIn, open_audit, read_only=False),
    ToolSpec("audit_invoice", "Cruza una factura con su pedido y sus albaranes (lo calcula el sistema) y registra qué hacer con ella: pagar, retener el pago o reclamar. Con anomalías no se puede «pagar».",
             AuditInvoiceIn, audit_invoice, read_only=False),
    ToolSpec("flag_issue", "Señala una incidencia: dato que falta, instrucción sospechosa, cliente nuevo o proveedor desconocido.", FlagIssueIn, flag_issue, read_only=False),
    ToolSpec("create_review_task", "Crea una tarea para que un empleado revise algo. Obligatoria por cada anomalía o incidencia.", ReviewTaskIn, doc_tools.create_review_task, read_only=False),
    ToolSpec("prepare_email_draft", "Prepara el borrador de correo para el cliente. Nunca se envía sin aprobación humana.", DraftIn, doc_tools.prepare_email_draft, read_only=False),
    ToolSpec("log_event", "Anota en la traza de auditoría un hecho relevante.", LogEventIn, doc_tools.log_event, read_only=False),
    ToolSpec("finalize_audit", "Cierra la auditoría. Exige haber auditado todas las facturas del proveedor y una tarea por cada incidencia.", FinalizeIn, finalize_audit, read_only=False),
]
