import pytest
from pydantic import ValidationError

from app.agents.manifest import AgentManifest
from app.agents.registry import AGENTS, AGENTS_BY_ID, list_agents
from test_api import make_client


def _base(**over):
    d = dict(id="demo-agente", name="Demo agente", summary="Resumen de negocio largo", pain="Dolor de negocio largo",
             input_description="Entrada", workflow="Workflow de negocio largo", output_description="Salida",
             verticals={"gestoria": "principal"}, status="proximamente")
    return {**d, **over}


def test_catalog_is_valid_and_unique():
    assert len({a.id for a in AGENTS}) == len(AGENTS)
    assert AGENTS_BY_ID["gestion-documental"].status == "disponible"
    assert {a.id for a in AGENTS if a.status == "disponible"} == {"gestion-documental", "presupuestos", "renovaciones", "auditor-facturas"}


def test_available_agent_needs_scenario_and_coming_soon_cannot_have_one():
    with pytest.raises(ValidationError):
        AgentManifest(**_base(status="disponible"))
    with pytest.raises(ValidationError):
        AgentManifest(**_base(default_scenario="email-martinez-nov"))
    AgentManifest(**_base(status="disponible", default_scenario="email-martinez-nov"))


def test_scenario_of_available_agents_exists_in_db(db):
    for a in AGENTS:
        if a.default_scenario:
            assert db.one("SELECT 1 FROM emails WHERE id=?", (a.default_scenario,)), a.id


def test_filter_by_vertical_puts_principal_first():
    cor = list_agents("correduria")
    assert {a.id for a in cor} >= {"comparador-seguros", "siniestros", "renovaciones"}
    principal = [a.verticals["correduria"] == "principal" for a in cor]
    assert principal == sorted(principal, reverse=True)
    ges = list_agents("gestoria")
    assert "comparador-seguros" not in {a.id for a in ges} and ges[0].verticals["gestoria"] == "principal"


def test_no_technical_terms_in_business_texts():
    banned = ("prompt", "token", "json", "api", "llm", "herramienta")
    for a in AGENTS:
        text = " ".join([a.name, a.summary, a.pain, a.input_description, a.workflow, a.output_description, *a.example_requests]).lower()
        assert not any(w in text.split() or w in text for w in banned), (a.id, text)


def test_agents_endpoints(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch) as c:
        body = c.get("/api/agents").json()
        assert [a["id"] for a in body["agents"]][0] == "gestion-documental"
        assert len(body["agents"]) == len(AGENTS)
        cor = c.get("/api/agents?vertical=correduria").json()["agents"]
        assert all("correduria" in a["verticals"] for a in cor)
        assert c.get("/api/agents?vertical=otra").status_code == 422
        assert c.get("/api/agents/siniestros").json()["status"] == "proximamente"
        assert c.get("/api/agents/nope").status_code == 404


# -- documentos de apoyo (información que consulta cada agente) ------------------------
def test_sources_for_every_available_agent(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch) as c:
        for a in AGENTS:
            if a.status != "disponible":
                continue
            sc = c.get(f"/api/scenario?agent_id={a.id}").json()
            assert sc["sources"], a.id
            ids = [s["id"] for s in sc["sources"]]
            assert "reglas" in ids and len(ids) == len(set(ids))
            doc = c.get(f"/api/sources/{ids[0]}?agent_id={a.id}").json()
            assert doc["sections"]
            pdf = c.get(f"/api/sources/{ids[0]}/pdf?agent_id={a.id}")
            assert pdf.status_code == 200 and pdf.content[:4] == b"%PDF"
        assert c.get("/api/sources/nope?agent_id=renovaciones").status_code == 404
        assert c.get("/api/sources/cliente?agent_id=nope").status_code == 404


def test_sources_never_expose_internal_data(db, settings, monkeypatch):
    import json
    with make_client(db, settings, monkeypatch) as c:
        for a, forbidden in (("renovaciones", ("comisión", "commission")), ("presupuestos", ("est_hours", "coste interno", "horas estimadas"))):
            ids = [s["id"] for s in c.get(f"/api/scenario?agent_id={a}").json()["sources"] if s["id"] != "reglas"]
            text = json.dumps([c.get(f"/api/sources/{i}?agent_id={a}").json() for i in ids], ensure_ascii=False).lower()
            assert not any(w in text for w in forbidden), (a, forbidden)


def test_renewal_sources_match_what_the_agent_sees(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch) as c:
        cartera = c.get("/api/sources/cartera?agent_id=renovaciones").json()
        assert len(cartera["sections"][0]["table"]["rows"]) == 5
        ofertas = c.get("/api/sources/ofertas?agent_id=renovaciones").json()
        assert len(ofertas["sections"][0]["table"]["rows"]) == 4  # solo las que vencen en la ventana
