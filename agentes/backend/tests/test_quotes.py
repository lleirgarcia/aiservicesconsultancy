"""Agente de presupuestos: validaciones y cálculo deterministas, confidencialidad, documento y API."""

import json
from decimal import Decimal

import pdfplumber
import pytest
from fastapi.testclient import TestClient

from app.agent.orchestrator import RunManager
from app.agent.runners import RunStats
from app.agents.presupuestos.presenter import QuotePresenter
from app.agents.presupuestos.tools import TOOLS
from app.events.bus import RunEventBus
from app.tools.base import RunContext, ToolError, execute_tool
from app.validation import quotes as q

MAIN_Q = "email-quote-martinez"
BY_NAME = {t.name: t for t in TOOLS}

# Servicios de la solicitud principal, con el fragmento literal de la solicitud que los justifica.
MAIN_LINES = [
    ("alta-sociedad", 1, None, "la constitución de la sociedad"),
    ("contab-80", 12, 45, "la contabilidad mensual (calculamos unas 45 facturas al mes)"),
    ("iva-trimestral", 4, None, "el IVA trimestral"),
    ("nominas", 36, None, "las nóminas de 3 trabajadores"),
    ("cuentas-anuales", 1, None, "las cuentas anuales"),
]


class QHarness:
    def __init__(self, db, settings, email_id=MAIN_Q, run_id="run-q"):
        db.execute("INSERT INTO runs (id, email_id, status, agent_id) VALUES (?,?,?,?)", (run_id, email_id, "en_curso", "presupuestos"))
        self.bus = RunEventBus(db, run_id, "presupuestos")
        self.ctx = RunContext(db=db, settings=settings, bus=self.bus, run_id=run_id, email_id=email_id)
        self.presenter = QuotePresenter()

    def call(self, name, **args):
        return execute_tool(self.ctx, BY_NAME[name], args, self.presenter)

    def events(self, type_=None):
        rows = self.ctx.db.all("SELECT type, payload FROM run_events WHERE run_id=? ORDER BY seq", (self.ctx.run_id,))
        return [{"type": r["type"], **json.loads(r["payload"])} for r in rows if type_ in (None, r["type"])]


def run_main_flow(h: QHarness, finalize=True):
    h.call("find_client", email_address="jordi@construccionsmartinez.example")
    h.call("get_quote_rules")
    h.call("get_service_catalog")
    h.call("open_quote", client_id="cli-martinez")
    for sid, qty, vol, src in MAIN_LINES:
        r = h.call("add_quote_line", service_id=sid, quantity=qty, volume=vol, source_text=src)
        assert not isinstance(r, ToolError), (sid, r)
    h.call("calculate_quote")
    h.call("flag_issue", kind="servicio_no_tarifado", title="Subvenciones europeas", detail="No está en el tarifario.",
           source_text="asesoraseis para pedir subvenciones europeas")
    h.call("create_review_task", title="Valorar asesoramiento en subvenciones", reason="No está en el tarifario.")
    h.call("prepare_email_draft", subject="Vuestro presupuesto", body="Hola Jordi, adjuntamos el presupuesto. Sobre las subvenciones europeas, os contestaremos aparte.")
    if finalize:
        return h.call("finalize_quote", summary="Presupuesto de 5 servicios; subvenciones pendientes.")


@pytest.fixture
def qh(db, settings):
    return QHarness(db, settings)


def expected_main_total() -> Decimal:
    rec = Decimal(2520 + 260 + 504 + 480)
    discount = (rec * 5 / 100).quantize(Decimal("0.01"))
    base = rec + 390 - discount
    return base + (base * 21 / 100).quantize(Decimal("0.01"))


def test_total_matches_independent_calculation(qh):
    out = run_main_flow(qh)
    assert out.data["totals"]["total"] == float(expected_main_total()) == 4798.62
    assert out.data["totals"]["discount"] == 188.20  # 4 servicios recurrentes distintos → 5 %


def test_prices_come_from_the_catalog_not_from_the_model(qh):
    qh.call("open_quote", client_id="cli-martinez")
    r = qh.call("add_quote_line", service_id="iva-trimestral", quantity=4, source_text="el IVA trimestral")
    assert r.data["unit_price"] == 65.0 and r.data["subtotal"] == 260.0
    bad = qh.call("add_quote_line", service_id="iva-trimestral", quantity=4, source_text="el IVA trimestral", unit_price=1)
    assert isinstance(bad, ToolError) and bad.code == "invalid_input"  # no existe parámetro de precio


def test_service_outside_catalog_cannot_be_priced(qh):
    qh.call("open_quote", client_id="cli-martinez")
    r = qh.call("add_quote_line", service_id="subvenciones", quantity=1, source_text="subvenciones europeas")
    assert isinstance(r, ToolError) and r.code == "unknown_service"


def test_source_must_be_in_the_request(qh):
    qh.call("open_quote", client_id="cli-martinez")
    r = qh.call("add_quote_line", service_id="iva-trimestral", quantity=4, source_text="el cliente quiere IVA anual con descuento")
    assert isinstance(r, ToolError) and r.code == "source_not_in_request"
    ok = qh.call("add_quote_line", service_id="iva-trimestral", quantity=4, source_text="EL  IVA   trimestral")  # mayúsculas y espacios
    assert not isinstance(ok, ToolError)


def test_tier_validation_with_hint(qh):
    qh.call("open_quote", client_id="cli-martinez")
    src = "la contabilidad mensual (calculamos unas 45 facturas al mes)"
    missing = qh.call("add_quote_line", service_id="contab-80", quantity=12, source_text=src)
    assert isinstance(missing, ToolError) and missing.code == "volume_required"
    wrong = qh.call("add_quote_line", service_id="contab-30", quantity=12, volume=45, source_text=src)
    assert isinstance(wrong, ToolError) and wrong.code == "wrong_tier" and "contab-80" in str(wrong)
    over = qh.call("add_quote_line", service_id="contab-150", quantity=12, volume=900, source_text=src)
    assert isinstance(over, ToolError) and over.code == "wrong_tier" and "supera" in str(over)


def test_adding_the_same_service_replaces_the_line(qh):
    qh.call("open_quote", client_id="cli-martinez")
    qh.call("add_quote_line", service_id="nominas", quantity=12, source_text="las nóminas de 3 trabajadores")
    qh.call("add_quote_line", service_id="nominas", quantity=36, source_text="las nóminas de 3 trabajadores")
    rows = qh.ctx.db.all("SELECT quantity FROM quote_lines WHERE case_id=?", (qh.ctx.case_id,))
    assert [r["quantity"] for r in rows] == [36]


def test_discount_only_with_three_recurring_families():
    base = dict(kind="recurrente", est_hours=1, quantity=1)
    two = q.compute_quote([{**base, "family": "a", "subtotal": 100}, {**base, "family": "b", "subtotal": 100}])
    three = q.compute_quote([{**base, "family": f, "subtotal": 100} for f in "abc"])
    tiers_only = q.compute_quote([{**base, "family": "a", "subtotal": 100}, {**base, "family": "a", "subtotal": 100}, {**base, "family": "a", "subtotal": 100}])
    assert two["discount"] == 0 and three["discount"] == 15.0 and tiers_only["discount"] == 0  # tres líneas de la misma familia no cuentan


def test_low_margin_is_flagged_automatically(qh):
    assert q.compute_quote([{"kind": "puntual", "family": "x", "subtotal": 100, "est_hours": 10, "quantity": 1}])["internal"]["below_min"] is True
    assert q.compute_quote([{"kind": "puntual", "family": "x", "subtotal": 100, "est_hours": 1, "quantity": 1}])["internal"]["below_min"] is False
    qh.call("open_quote", client_id="cli-martinez")
    qh.ctx.db.execute("INSERT INTO quote_lines VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                      (qh.ctx.case_id, "x", "Servicio caro de hacer", "puntual", "x", "servicio", 1, 100, 100, 10, "x"))
    out = qh.call("calculate_quote")
    assert out.data["margin_below_minimum"] is True
    assert qh.ctx.db.one("SELECT kind FROM incidents WHERE case_id=? AND kind='margen_bajo'", (qh.ctx.case_id,))


def test_finalize_needs_a_task_per_incident_and_a_non_empty_quote(qh):
    qh.call("open_quote", client_id="cli-martinez")
    assert qh.call("finalize_quote", summary="x").code == "empty_quote"
    qh.call("add_quote_line", service_id="iva-trimestral", quantity=4, source_text="el IVA trimestral")
    qh.call("flag_issue", kind="descuento_solicitado", title="Piden un descuento", detail="El cliente pide un descuento.")
    r = qh.call("finalize_quote", summary="x")
    assert isinstance(r, ToolError) and r.code == "missing_review_tasks"
    qh.call("create_review_task", title="Descuento pedido", reason="Decide dirección.")
    assert not isinstance(qh.call("finalize_quote", summary="x"), ToolError)


def test_confidential_information_never_reaches_the_client(qh, settings):
    out = run_main_flow(qh)
    assert not isinstance(out, ToolError)
    leak = qh.call("prepare_email_draft", subject="Presupuesto", body="Nuestro margen es del 47 %.")
    assert isinstance(leak, ToolError) and leak.code == "confidential"
    result = json.loads(qh.ctx.db.one("SELECT result FROM cases WHERE id=?", (qh.ctx.case_id,))["result"])
    assert "margin_pct" in json.dumps(result["internal"]) and "internal" not in result["totals"]  # el margen va en un bloque interno aparte
    draft = result["email_draft"]["body"].lower()
    assert "margen" not in draft and "coste interno" not in draft
    pdf = settings.quotes_dir / f"{qh.ctx.case_id}.pdf"
    with pdfplumber.open(pdf) as doc:
        text = " ".join(p.extract_text() or "" for p in doc.pages).lower()
    assert "4.798,62" in text and "margen" not in text and "coste" not in text and "horas" not in text


def test_quote_without_enough_information_is_pending_not_invented(db, settings):
    h = QHarness(db, settings, "email-quote-vague", "run-v")
    h.call("find_client", email_address="marta@fusteriaroca.example")
    h.call("open_quote", client_id="cli-roca" if db.one("SELECT 1 FROM clients WHERE id='cli-roca'") else None)
    h.call("flag_issue", kind="dato_faltante", title="Falta el volumen de facturas", detail="No indica cuántas facturas al mes.",
           source_text="la contabilidad")
    h.call("create_review_task", title="Pedir datos al cliente", reason="Faltan facturas al mes y número de trabajadores.")
    h.call("prepare_email_draft", subject="Para preparar vuestro presupuesto", body="Hola, ¿cuántas facturas al mes y cuántos trabajadores tenéis?")
    out = h.call("finalize_quote", summary="Faltan datos.")
    assert not isinstance(out, ToolError) and out.data["status"] == "pendiente_de_informacion" and out.data["totals"] is None
    assert not (settings.quotes_dir / f"{h.ctx.case_id}.pdf").exists()


def test_timeline_has_no_technical_terms(qh):
    run_main_flow(qh)
    banned = ("tool", "json", "token", "prompt", "api", "add_quote_line", "flag_issue", "calculate_quote", "finalize_quote", "get_service_catalog", "error interno")
    for ev in qh.events():
        if ev["type"] in ("activity_started", "activity_finished"):
            text = f"{ev.get('label')} {ev.get('detail')}".lower()
            assert not any(b in text for b in banned), text


# -- API ----------------------------------------------------------------------------------------
class ScriptedQuoteRunner:
    async def run(self, ctx, system_prompt, user_message, tools, execute, followup=None):
        h = QHarness.__new__(QHarness)
        h.ctx, h.presenter = ctx, None
        by = {t.name: t for t in tools}
        call = lambda n, **a: execute(ctx, by[n], a)  # noqa: E731
        call("find_client", email_address="jordi@construccionsmartinez.example")
        call("open_quote", client_id="cli-martinez")
        for sid, qty, vol, src in MAIN_LINES:
            call("add_quote_line", service_id=sid, quantity=qty, volume=vol, source_text=src)
        call("calculate_quote")
        call("flag_issue", kind="servicio_no_tarifado", title="Subvenciones europeas", detail="No está en el tarifario.")
        call("create_review_task", title="Valorar subvenciones", reason="No está en el tarifario.")
        call("prepare_email_draft", subject="Presupuesto", body="Hola Jordi, adjuntamos el presupuesto.")
        call("finalize_quote", summary="ok")
        return RunStats(turns=1)


def test_api_run_of_the_quote_agent_and_pdf(db, settings, monkeypatch):
    monkeypatch.setattr("app.api.main.get_settings", lambda: settings)
    from app.api.main import create_app
    with TestClient(create_app(RunManager(db, settings, runner=ScriptedQuoteRunner()))) as c:
        sc = c.get("/api/scenario?agent_id=presupuestos").json()
        assert sc["email"]["id"] == MAIN_Q and sc["attachments"] == []
        assert sc["assumptions"] == {"manual_minutes": 45.0, "review_minutes": 5.0}
        assert c.get("/api/scenario?agent_id=nope").status_code == 404
        run_id = c.post("/api/runs", json={"agent_id": "presupuestos"}).json()["run_id"]
        with c.stream("GET", f"/api/runs/{run_id}/events") as r:
            events = [json.loads(line[6:]) for line in r.iter_lines() if line.startswith("data: ") and line != "data: {}"]
        assert all(e["payload"]["agent_id"] == "presupuestos" for e in events)
        started = next(e for e in events if e["type"] == "run_started")
        assert started["payload"]["kpi_labels"]["processed"] == "Líneas del presupuesto"
        assert [p["id"] for p in started["payload"]["phases"]][-1] == "presupuesto"
        fin = next(e for e in events if e["type"] == "run_finished")["payload"]
        assert fin["status"] == "completada" and fin["case"]["totals"]["total"] == 4798.62
        assert fin["case"]["pdf_url"] == f"/api/quotes/{fin['case']['quote_id']}/pdf"
        pdf = c.get(fin["case"]["pdf_url"])
        assert pdf.status_code == 200 and pdf.headers["content-type"] == "application/pdf" and pdf.content[:4] == b"%PDF"
        assert c.get("/api/quotes/PRE-nada/pdf").status_code == 404
        assert c.get("/api/quotes/EXP-202611-0001/pdf").status_code == 404  # solo presupuestos
