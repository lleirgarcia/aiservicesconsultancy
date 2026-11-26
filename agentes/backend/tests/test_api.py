"""API con un runner de prueba que reproduce una secuencia fija de llamadas.

El runner guionizado solo existe en los tests: la aplicación usa siempre el agente real.
"""

import json

from fastapi.testclient import TestClient

from app.agent.orchestrator import RunManager
from app.agent.runners import RunStats
from conftest import MAIN, MAIN_EXTRACTIONS


class ScriptedRunner:
    async def run(self, ctx, system_prompt, user_message, tools, execute, followup=None):
        by = {t.name: t for t in tools}
        call = lambda n, **a: execute(ctx, by[n], a)  # noqa: E731
        call("find_client", email_address="jordi@construccionsmartinez.example")
        call("open_case", client_id="cli-martinez")
        for k, d in MAIN_EXTRACTIONS.items():
            call("submit_extraction", attachment_id=f"{MAIN}-{k}", **d)
        for k, d in MAIN_EXTRACTIONS.items():
            dup = call("check_duplicates", attachment_id=f"{MAIN}-{k}").data["is_duplicate"]
            call("register_document", attachment_id=f"{MAIN}-{k}", status="duplicate" if dup else "valid", category=d["category"])
        call("get_recurring_patterns", client_id="cli-martinez")
        call("prepare_email_draft", subject="Documentación de noviembre", body="Falta la factura del alquiler.")
        call("create_review_task", title="Confirmar duplicado", reason="x")
        call("create_review_task", title="Reclamar alquiler", reason="y")
        call("finalize_case", summary="ok")
        return RunStats(turns=1)


def make_client(db, settings, monkeypatch, coordinator=None):
    monkeypatch.setattr("app.api.main.get_settings", lambda: settings)
    from app.api.main import create_app
    return TestClient(create_app(RunManager(db, settings, runner=ScriptedRunner()), coordinator=coordinator))


def test_full_run_over_sse_and_draft_actions(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch) as c:
        sc = c.get("/api/scenario").json()
        assert len(sc["attachments"]) == 5 and sc["email"]["subject"] == "Documentación contable de noviembre"
        assert c.get(sc["attachments"][0]["preview_url"]).headers["content-type"] == "image/png"

        run_id = c.post("/api/runs", json={}).json()["run_id"]
        events = []
        with c.stream("GET", f"/api/runs/{run_id}/events") as r:
            for line in r.iter_lines():
                if line.startswith("data: ") and line != "data: {}":
                    events.append(json.loads(line[6:]))
        types = [e["type"] for e in events]
        assert types[0] == "run_started" and types[-1] == "run_finished"
        fin = events[-1]["payload"]
        assert fin["status"] == "completada"
        assert fin["case"]["duplicate_count"] == 1 and fin["case"]["valid_count"] == 4
        metrics = [e["payload"] for e in events if e["type"] == "metrics"][-1]
        assert metrics["documents_processed"] == 5 and metrics["incidents"] == 2 and metrics["minutes_saved"] == 13

        draft_id = fin["case"]["email_draft"]["id"]
        edited = c.put(f"/api/drafts/{draft_id}", json={"subject": "Asunto", "body": "Texto editado"}).json()
        assert edited["status"] == "editado" and edited["body"] == "Texto editado"
        approved = c.post(f"/api/drafts/{draft_id}/approve").json()
        assert approved["status"] == "aprobado" and approved["sent"] is False
        assert c.post(f"/api/drafts/{draft_id}/reject").status_code == 409
        assert [a["action"] for a in c.get(f"/api/drafts/{draft_id}").json()["actions"]] == ["editar", "aprobar"]

        replay = c.get(f"/api/runs/{run_id}/events.json").json()
        assert len(replay["events"]) == len(events)
        assert c.get("/api/scenario").json()["latest_recorded_run"]["id"] == run_id


def test_unknown_email_and_run(db, settings, monkeypatch):
    with make_client(db, settings, monkeypatch) as c:
        assert c.post("/api/runs", json={"email_id": "nope"}).status_code == 404
        assert c.get("/api/runs/nope").status_code == 404
        assert c.get("/api/scenario?email_id=nope").status_code == 404
