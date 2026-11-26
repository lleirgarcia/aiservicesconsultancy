"""Agente auditor de facturas: cruce determinista, herramientas y presentador (sin llamar al modelo)."""

from __future__ import annotations

import json

import pytest

from app.agents.auditor_facturas.presenter import AuditPresenter
from app.agents.auditor_facturas.tools import TOOLS
from app.events.bus import RunEventBus
from app.seed.dataset import CLIENTS
from app.tools.base import RunContext, ToolError, execute_tool
from app.validation import audit as av

BY_NAME = {t.name: t for t in TOOLS}
MAIN = "email-audit-martinez"
TAX = CLIENTS["cli-martinez"].tax_id
INVOICES = ["fac-mat-0901", "fac-mat-0901b", "fac-mat-0922", "fac-mat-0937", "fac-mat-0951"]


class AHarness:
    def __init__(self, db, settings, email_id=MAIN, run_id="run-a"):
        db.execute("INSERT INTO runs (id, email_id, status, agent_id) VALUES (?,?,?,?)", (run_id, email_id, "en_curso", "auditor-facturas"))
        self.bus = RunEventBus(db, run_id, "auditor-facturas")
        self.ctx = RunContext(db=db, settings=settings, bus=self.bus, run_id=run_id, email_id=email_id)
        self.presenter = AuditPresenter()

    def call(self, name, **args):
        return execute_tool(self.ctx, BY_NAME[name], args, self.presenter)

    def events(self, type_=None):
        rows = self.ctx.db.all("SELECT type, payload FROM run_events WHERE run_id=? ORDER BY seq", (self.ctx.run_id,))
        return [{"type": r["type"], **json.loads(r["payload"])} for r in rows if type_ in (None, r["type"])]


@pytest.fixture
def ah(db, settings):
    return AHarness(db, settings)


def open_main(ah):
    ah.call("find_client", tax_id=TAX)
    return ah.call("open_audit", client_id="cli-martinez", supplier_id="sup-mat")


def audit_all(ah):
    open_main(ah)
    plan = {"fac-mat-0901": "pagar", "fac-mat-0901b": "retener_pago", "fac-mat-0922": "reclamar_proveedor",
            "fac-mat-0937": "reclamar_proveedor", "fac-mat-0951": "retener_pago"}
    for inv, action in plan.items():
        r = ah.call("audit_invoice", invoice_id=inv, action=action, rationale="Resultado del cruce con pedido y albarán.")
        assert not isinstance(r, ToolError), (inv, r)


# -- cruce ---------------------------------------------------------------------------
def _inv(base=100.0, vat=21.0, total=121.0):
    return {"base": base, "vat": vat, "total": total}


def test_match_rules_unit():
    lines = [{"item_code": "X", "description": "Pieza", "quantity": 10, "unit_price": 10.0}]
    order = [{"item_code": "X", "unit_price": 10.0, "quantity": 10}]
    assert av.match_invoice(_inv(), lines, order, {"X": 10}, None) == []
    f = av.match_invoice(_inv(), lines, order, {"X": 8}, None)
    assert [x["kind"] for x in f] == ["cantidad_no_entregada"] and f[0]["amount"] == 20.0
    lines2 = [{**lines[0], "unit_price": 11.0}]
    f = av.match_invoice(_inv(110, 23.1, 133.1), lines2, order, {"X": 10}, None)
    assert [x["kind"] for x in f] == ["precio_distinto"] and f[0]["amount"] == 10.0
    assert [x["kind"] for x in av.match_invoice(_inv(), lines, None, {}, None)] == ["sin_pedido"]
    assert [x["kind"] for x in av.match_invoice(_inv(), lines, order, {"X": 10}, "F-1")] == ["duplicada"]
    f = av.match_invoice(_inv(100, 21, 130), lines, order, {"X": 10}, None)  # el total no es base + IVA
    assert [x["kind"] for x in f] == ["error_aritmetico"]
    other = [{"item_code": "Y", "description": "Otro", "quantity": 1, "unit_price": 5.0}]
    assert "concepto_no_pedido" in [x["kind"] for x in av.match_invoice(_inv(5, 1.05, 6.05), other, order, {}, None)]
    assert av.norm_number("MAT-2026/0901") == av.norm_number("mat 2026 0901")


def test_seed_scenarios_exist(db):
    for eid in ("email-audit-martinez", "email-audit-quiet", "email-audit-malicious"):
        assert db.one("SELECT 1 FROM emails WHERE id=?", (eid,))


# -- herramientas -----------------------------------------------------------------------
def test_list_documents_groups_by_supplier(ah):
    d = ah.call("list_audit_documents", client_id="cli-martinez").data
    assert len(d["suppliers"]) == 1 and len(d["suppliers"][0]["invoices"]) == 5
    assert d["suppliers"][0]["orders"] == 3 and d["suppliers"][0]["delivery_notes"] == 3


def test_cannot_pay_invoice_with_findings(ah):
    open_main(ah)
    r = ah.call("audit_invoice", invoice_id="fac-mat-0922", action="pagar", rationale="Parece correcta.")
    assert isinstance(r, ToolError) and r.code == "findings_require_review"
    assert not ah.ctx.db.one("SELECT 1 FROM audit_reviews")
    r = ah.call("audit_invoice", invoice_id="fac-mat-0901", action="pagar", rationale="Cuadra con pedido y albarán.")
    assert not isinstance(r, ToolError) and r.data["findings"] == []


def test_findings_per_invoice(ah):
    open_main(ah)
    got = {}
    for inv in INVOICES:
        r = ah.call("audit_invoice", invoice_id=inv, action="reclamar_proveedor" if inv != "fac-mat-0901" else "pagar", rationale="Resultado del cruce.")
        got[inv] = [(f["kind"], f["amount"]) for f in r.data["findings"]]
    assert got == {"fac-mat-0901": [], "fac-mat-0901b": [("duplicada", 1749.0)], "fac-mat-0922": [("precio_distinto", 130.0)],
                   "fac-mat-0937": [("cantidad_no_entregada", 228.0)], "fac-mat-0951": [("sin_pedido", 2100.0)]}


def test_invoice_of_other_supplier_or_client_is_rejected(ah):
    open_main(ah)
    r = ah.call("audit_invoice", invoice_id="fac-tal-0388", action="pagar", rationale="Es de otro cliente.")
    assert isinstance(r, ToolError) and r.code == "unknown_invoice"
    r = ah.call("audit_invoice", invoice_id="PO-2026-101", action="pagar", rationale="Esto es un pedido.")
    assert isinstance(r, ToolError) and r.code == "unknown_invoice"


def test_finalize_requires_all_invoices_and_tasks(ah):
    open_main(ah)
    ah.call("audit_invoice", invoice_id="fac-mat-0901", action="pagar", rationale="Cuadra con pedido y albarán.")
    r = ah.call("finalize_audit", summary="Resumen.")
    assert isinstance(r, ToolError) and r.code == "unaudited_invoices"
    audit_all(ah)
    r = ah.call("finalize_audit", summary="Resumen.")
    assert isinstance(r, ToolError) and r.code == "missing_review_tasks"


def test_full_flow_totals(ah):
    audit_all(ah)
    for t in ("Reclamar el duplicado", "Reclamar el sobreprecio", "Reclamar lo no entregado", "Autorizar o rechazar la factura sin pedido"):
        ah.call("create_review_task", title=t, reason="Anomalía de la auditoría.", priority="alta")
    ah.call("prepare_email_draft", subject="Auditoría de facturas", body="Hola Jordi, hemos detectado anomalías.")
    r = ah.call("finalize_audit", summary="Cinco facturas auditadas.")
    assert not isinstance(r, ToolError), r
    res = json.loads(ah.ctx.db.one("SELECT result FROM cases WHERE id=?", (ah.ctx.case_id,))["result"])
    t = res["totals"]
    assert t["invoices"] == 5 and t["clean"] == 1 and t["with_findings"] == 4
    assert t["at_risk_base"] == 4207.0 and t["at_risk_vat"] == 883.47 and t["at_risk_total"] == 5090.47
    assert t["by_kind"] == {"duplicada": 1749.0, "precio_distinto": 130.0, "cantidad_no_entregada": 228.0, "sin_pedido": 2100.0}
    assert res["supplier"]["name"].startswith("Materials") and res["status"] == "listo_para_revision"
    assert ah.ctx.db.one("SELECT to_address FROM email_drafts")["to_address"] == "jordi@construccionsmartinez.example"


def test_clean_supplier_has_no_findings(db, settings):
    h = AHarness(db, settings, "email-audit-quiet", "run-q3")
    h.call("find_client", tax_id=CLIENTS["cli-roca"].tax_id)
    h.call("open_audit", client_id="cli-roca", supplier_id="sup-fus")
    for inv in ("fac-fus-0412", "fac-fus-0431"):
        r = h.call("audit_invoice", invoice_id=inv, action="pagar", rationale="Cuadra con pedido y albarán.")
        assert not isinstance(r, ToolError) and r.data["findings"] == []
    r = h.call("finalize_audit", summary="Todo cuadra.")
    assert not isinstance(r, ToolError) and r.data["totals"]["at_risk_base"] == 0


def test_presenter_emits_business_language(ah):
    open_main(ah)
    ah.call("audit_invoice", invoice_id="fac-mat-0922", action="reclamar_proveedor", rationale="Sobreprecio del cemento.")
    assert any("anomal" in e["label"] for e in ah.events("activity_finished"))
    kinds = [e["kind"] for e in ah.events("result")]
    assert "audit_invoice" in kinds and kinds.count("incident") == 1
    assert "audit_invoice\"" not in json.dumps([e for e in ah.events("activity_finished")], ensure_ascii=False)
