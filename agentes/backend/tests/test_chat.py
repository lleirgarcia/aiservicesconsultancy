"""Chat y arranque por agente, con un coordinador de prueba (la IA real se evalúa en tests/evals)."""

import json

from app.coordinator.coordinator import Outcome
from test_api import make_client


class FakeCoordinator:
    """Decide por palabras clave y llama a `launch` como lo haría el coordinador real."""

    def __init__(self):
        self.messages = []

    async def handle(self, message, launch):
        self.messages.append(message)
        text = message.lower()
        if "siniestro" in text:
            try:
                launch("siniestros")
            except Exception as exc:  # noqa: BLE001
                return Outcome("answered", f"no disponible ({type(exc).__name__})")
        if "correo" in text or "facturas" in text:
            try:
                run_id = launch("gestion-documental")
            except Exception as exc:  # noqa: BLE001
                return Outcome("answered", f"ocupado ({type(exc).__name__})")
            return Outcome("launched", "Lo pongo en marcha.", "gestion-documental", run_id)
        return Outcome("answered", "Eso no lo puedo hacer.")


def test_chat_launches_the_available_agent_and_events_carry_agent_id(db, settings, monkeypatch):
    fake = FakeCoordinator()
    with make_client(db, settings, monkeypatch, coordinator=fake) as c:
        r = c.post("/api/chat", json={"message": "Procesa el correo de Martínez"})
        assert r.status_code == 200
        body = r.json()
        assert body["action"] == "launched" and body["agent_id"] == "gestion-documental"
        assert body["events_url"] == f"/api/runs/{body['run_id']}/events"
        events = c.get(f"/api/runs/{body['run_id']}/events.json").json()["events"]
        assert events and all(e["payload"]["agent_id"] == "gestion-documental" for e in events)
        run = c.get(f"/api/runs/{body['run_id']}").json()
        assert run["agent_id"] == "gestion-documental"
        assert fake.messages == ["Procesa el correo de Martínez"]


def test_chat_without_matching_agent_does_not_start_anything(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch, coordinator=FakeCoordinator()) as c:
        body = c.post("/api/chat", json={"message": "hazme la renta"}).json()
        assert body["action"] == "answered" and body["run_id"] is None and body["events_url"] is None
        assert db.one("SELECT count(*) AS n FROM runs")["n"] == 0


def test_chat_coming_soon_agent_is_not_launched(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch, coordinator=FakeCoordinator()) as c:
        body = c.post("/api/chat", json={"message": "tramita este siniestro"}).json()
        assert body["action"] == "answered" and "AgentUnavailable" in body["reply"]
        assert db.one("SELECT count(*) AS n FROM runs")["n"] == 0


def test_chat_validation_and_coordinator_failure(db, settings, monkeypatch):
    class Broken:
        async def handle(self, message, launch):
            raise RuntimeError("sin conexión")

    with make_client(db, settings, monkeypatch, coordinator=Broken()) as c:
        assert c.post("/api/chat", json={"message": ""}).status_code == 422
        assert c.post("/api/chat", json={"message": "x" * 1001}).status_code == 422
        r = c.post("/api/chat", json={"message": "hola"})
        assert r.status_code == 502 and r.json()["detail"]["error"] == "coordinator_unavailable"


def test_start_run_by_agent(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch, coordinator=FakeCoordinator()) as c:
        assert c.post("/api/runs", json={"agent_id": "nope"}).status_code == 404
        r = c.post("/api/runs", json={"agent_id": "siniestros"})
        assert r.status_code == 409 and r.json()["detail"]["error"] == "agent_unavailable"
        assert c.post("/api/runs", json={"email_id": "nope"}).json()["detail"]["error"] == "email_not_found"
        ok = c.post("/api/runs", json={})
        assert ok.status_code == 202
        # Sin cuerpo de agente se usa el documental con su escenario por defecto.
        assert c.get(f"/api/runs/{ok.json()['run_id']}").json()["email_id"] == "email-martinez-nov"
