"""Agente de renovaciones: reglas deterministas, herramientas y presentador (sin llamar al modelo)."""

from __future__ import annotations

import json

import pytest

from app.agents.renovaciones.presenter import RenewalPresenter
from app.agents.renovaciones.tools import TOOLS
from app.events.bus import RunEventBus
from app.seed.dataset import CLIENTS
from app.tools.base import RunContext, ToolError, execute_tool
from app.validation import renewals as rv

BY_NAME = {t.name: t for t in TOOLS}
MAIN = "email-renew-martinez"
TAX = CLIENTS["cli-martinez"].tax_id


class RHarness:
    def __init__(self, db, settings, email_id=MAIN, run_id="run-r"):
        db.execute("INSERT INTO runs (id, email_id, status, agent_id) VALUES (?,?,?,?)", (run_id, email_id, "en_curso", "renovaciones"))
        self.bus = RunEventBus(db, run_id, "renovaciones")
        self.ctx = RunContext(db=db, settings=settings, bus=self.bus, run_id=run_id, email_id=email_id)
        self.presenter = RenewalPresenter()

    def call(self, name, **args):
        return execute_tool(self.ctx, BY_NAME[name], args, self.presenter)

    def events(self, type_=None):
        rows = self.ctx.db.all("SELECT type, payload FROM run_events WHERE run_id=? ORDER BY seq", (self.ctx.run_id,))
        return [{"type": r["type"], **json.loads(r["payload"])} for r in rows if type_ in (None, r["type"])]


@pytest.fixture
def rh(db, settings):
    return RHarness(db, settings)


def open_main(rh):
    rh.call("find_client", tax_id=TAX)
    return rh.call("open_renewal", client_id="cli-martinez")


def review_all(rh):
    open_main(rh)
    rh.call("review_policy", policy_id="pol-mar-flota", recommendation="renovar", rationale="Mismas condiciones y sin siniestros.")
    rh.call("review_policy", policy_id="pol-mar-rc", recommendation="renegociar", rationale="Subida del 22 % con dos siniestros.")
    rh.call("review_policy", policy_id="pol-mar-oficinas", recommendation="renegociar", rationale="Recorta el límite de daños por agua.")
    rh.call("review_policy", policy_id="pol-mar-salud", recommendation="renegociar", rationale="Falta la oferta de la aseguradora.")


# -- reglas -----------------------------------------------------------------------
def test_rules_flags_and_percentages():
    base = dict(annual_premium=1000.0, renewal_premium=1100.0, coverage_reduced=0, claims_12m=0)
    assert rv.policy_flags(base) == []  # exactamente el 10 % no supera el límite
    assert rv.policy_flags({**base, "renewal_premium": 1100.01}) == ["subida_prima"]
    assert rv.policy_flags({**base, "coverage_reduced": 1, "claims_12m": 2}) == ["cobertura_reducida", "siniestralidad"]
    assert rv.policy_flags({**base, "renewal_premium": None}) == ["sin_oferta"]
    assert rv.change_pct(3200, 3904) == 22.0
    assert rv.days_left("2026-12-01", "2026-11-23") == 8
    assert rv.in_window(0) and rv.in_window(60) and not rv.in_window(61) and not rv.in_window(-1)


def test_seed_scenarios_exist(db):
    for eid in ("email-renew-martinez", "email-renew-quiet", "email-renew-malicious"):
        assert db.one("SELECT 1 FROM emails WHERE id=?", (eid,))
    assert db.one("SELECT count(*) AS n FROM policies WHERE client_id='cli-martinez'")["n"] == 5


# -- herramientas -----------------------------------------------------------------
def test_find_client_by_tax_id_in_request(rh):
    d = rh.call("find_client", tax_id=TAX).data
    assert d["status"] == "identified" and d["client"]["legal_name"].startswith("Construccions")


def test_list_policies_marks_window_and_flags(rh):
    open_main(rh)
    d = rh.call("list_client_policies", client_id="cli-martinez").data
    by = {p["policy_id"]: p for p in d["policies"]}
    assert d["in_window"] == 4 and not by["pol-mar-accidentes"]["in_window"]
    assert by["pol-mar-flota"]["flags"] == [] and by["pol-mar-flota"]["urgent"]
    assert by["pol-mar-rc"]["flags"] == ["subida_prima", "siniestralidad"]
    assert by["pol-mar-oficinas"]["flags"] == ["cobertura_reducida"]
    assert by["pol-mar-salud"]["flags"] == ["sin_oferta"]


def test_cannot_recommend_renew_with_alerts(rh):
    open_main(rh)
    r = rh.call("review_policy", policy_id="pol-mar-rc", recommendation="renovar", rationale="Parece razonable renovar.")
    assert isinstance(r, ToolError) and r.code == "flags_require_review"
    assert not rh.ctx.db.one("SELECT 1 FROM renewal_reviews WHERE policy_id='pol-mar-rc'")


def test_outside_window_and_foreign_policy_are_rejected(rh):
    open_main(rh)
    r = rh.call("review_policy", policy_id="pol-mar-accidentes", recommendation="renovar", rationale="Vence en mayo.")
    assert isinstance(r, ToolError) and r.code == "outside_window"
    r = rh.call("review_policy", policy_id="pol-comas-camiones", recommendation="renovar", rationale="De otro cliente.")
    assert isinstance(r, ToolError) and r.code == "unknown_policy"


def test_alerts_create_incidents_automatically(rh):
    open_main(rh)
    rh.call("review_policy", policy_id="pol-mar-rc", recommendation="renegociar", rationale="Subida del 22 % con dos siniestros.")
    kinds = {i["kind"] for i in rh.ctx.db.all("SELECT kind FROM incidents WHERE case_id=?", (rh.ctx.case_id,))}
    assert kinds == {"subida_prima", "siniestralidad"}
    rh.call("review_policy", policy_id="pol-mar-rc", recommendation="buscar_alternativas", rationale="Mejor ver otras aseguradoras.")
    assert rh.ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (rh.ctx.case_id,))["n"] == 2  # sin duplicar


def test_finalize_requires_all_policies_and_tasks(rh):
    open_main(rh)
    rh.call("review_policy", policy_id="pol-mar-flota", recommendation="renovar", rationale="Mismas condiciones.")
    r = rh.call("finalize_renewal", summary="Resumen.")
    assert isinstance(r, ToolError) and r.code == "unreviewed_policies"
    review_all(rh)
    r = rh.call("finalize_renewal", summary="Resumen.")
    assert isinstance(r, ToolError) and r.code == "missing_review_tasks"


def test_full_flow_totals_and_confidentiality(rh):
    review_all(rh)
    for title in ("Revisar la subida de la RC de obra", "Revisar el recorte del multirriesgo", "Reclamar la oferta de salud colectiva", "Revisar siniestralidad de la RC"):
        rh.call("create_review_task", title=title, reason="Alerta de la revisión.", priority="alta")
    bad = rh.call("prepare_email_draft", subject="Renovaciones", body="Os cobraremos una comisión del 15 %.")
    assert isinstance(bad, ToolError) and bad.code == "confidential"
    rh.call("prepare_email_draft", subject="Vuestras renovaciones", body="Hola Jordi, la flota vence el 1 de diciembre.")
    r = rh.call("finalize_renewal", summary="Cuatro pólizas revisadas.")
    assert not isinstance(r, ToolError), r
    res = json.loads(rh.ctx.db.one("SELECT result FROM cases WHERE id=?", (rh.ctx.case_id,))["result"])
    t = res["totals"]
    assert t["policies"] == 4 and t["premium_in_window"] == 11870.0 and t["premium_at_risk"] == 7050.0
    assert t["at_risk_count"] == 3 and t["urgent_count"] == 1
    assert res["internal"]["commission"] > 0 and "commission" not in t
    assert res["policies"][0]["policy_id"] == "pol-mar-flota"  # ordenadas por urgencia
    assert res["status"] == "listo_para_revision"
    assert rh.ctx.db.one("SELECT to_address FROM email_drafts")["to_address"] == "jordi@construccionsmartinez.example"


def test_quiet_client_closes_without_inventing_work(db, settings):
    h = RHarness(db, settings, "email-renew-quiet", "run-q2")
    h.call("find_client", tax_id=CLIENTS["cli-roca"].tax_id)
    h.call("open_renewal", client_id="cli-roca")
    assert h.call("list_client_policies", client_id="cli-roca").data["in_window"] == 0
    r = h.call("finalize_renewal", summary="Ninguna póliza vence en el plazo.")
    assert not isinstance(r, ToolError) and r.data["status"] == "sin_vencimientos"


def test_presenter_emits_business_language(rh):
    open_main(rh)
    rh.call("review_policy", policy_id="pol-mar-rc", recommendation="renegociar", rationale="Subida del 22 % con dos siniestros.")
    assert any("alerta" in e["label"] for e in rh.events("activity_finished"))
    kinds = [e["kind"] for e in rh.events("result")]
    assert "renewal_policy" in kinds and kinds.count("incident") == 2
    text = json.dumps(rh.events(), ensure_ascii=False).lower()
    assert "review_policy" not in text
