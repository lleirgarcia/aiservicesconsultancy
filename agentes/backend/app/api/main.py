"""API HTTP de la demo. Inventario completo en docs/API.md."""

from __future__ import annotations

import asyncio
import json
import hmac
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.agent.orchestrator import AgentUnavailable, RunBusy, RunManager
from app.agents.registry import AGENTS_BY_ID, list_agents
from app.config import get_settings
from app.coordinator.coordinator import Coordinator, build_coordinator
from app.mail.imap import ImapSource
from app.mail.service import InboxService
from app.persistence.db import Database
from app.sources.build import build_sources, light
from app.sources.pdf import render_source_pdf
from app.tools.base import now_iso

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
FRONTEND_DIST = Path(__file__).resolve().parents[3] / "frontend" / "dist"
MAIN_EMAIL = "email-martinez-nov"


class StartRun(BaseModel):
    agent_id: str = "gestion-documental"
    email_id: str | None = None  # por defecto, el escenario del agente


class DraftEdit(BaseModel):
    subject: str = Field(min_length=1, max_length=160)
    body: str = Field(min_length=1, max_length=4000)


class InboxLaunch(BaseModel):
    agent_id: str


class ChatMessage(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


def create_app(manager: RunManager | None = None, coordinator: Coordinator | None = None) -> FastAPI:
    settings = get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        db = Database(settings.db_path)
        app.state.db = db
        app.state.runs = manager or RunManager(db, settings)
        app.state.coordinator = coordinator or build_coordinator(settings)
        source = ImapSource(settings.imap_host, settings.imap_user, settings.imap_password, settings.imap_alias) if settings.inbox_enabled else None
        app.state.inbox = InboxService(db, settings, app.state.runs, app.state.coordinator, source)
        poller = asyncio.create_task(app.state.inbox.run_forever()) if source else None
        try:
            yield
        finally:
            if poller:
                poller.cancel()

    app = FastAPI(title="Kroomix · Agente de gestión documental", lifespan=lifespan)

    # Con AGENTES_SECRET definida, solo atiende peticiones que traigan esa clave en `x-agentes-key`
    # (la añade el proxy de Next). Evita que cualquiera lance agentes con la suscripción. Sin variable: abierto (local).
    secreto = os.environ.get("AGENTES_SECRET", "")
    if secreto:
        @app.middleware("http")
        async def exigir_clave(request, call_next):
            if request.url.path != "/api/health" and not hmac.compare_digest(request.headers.get("x-agentes-key", ""), secreto):
                return Response(status_code=401, content='{"detail":{"code":"unauthorized","message":"No autorizado."}}', media_type="application/json")
            return await call_next(request)

    def db() -> Database:
        return app.state.db

    @app.get("/api/health")
    def health():
        return {"ok": True, "provider": settings.ai_provider, "model": settings.model,
                "data_ready": bool(db().one("SELECT 1 AS x FROM emails LIMIT 1"))}

    @app.get("/api/agents")
    def agents(vertical: str | None = None):
        if vertical not in (None, "gestoria", "correduria"):
            raise HTTPException(422, {"error": "invalid_vertical", "message": "El vertical debe ser «gestoria» o «correduria»."})
        return {"agents": [a.model_dump() for a in list_agents(vertical)]}

    @app.get("/api/agents/{agent_id}")
    def agent(agent_id: str):
        a = AGENTS_BY_ID.get(agent_id)
        if not a:
            raise HTTPException(404, {"error": "agent_not_found", "message": f"No existe el agente {agent_id}."})
        return a.model_dump()

    @app.get("/api/scenario")
    def scenario(email_id: str | None = None, agent_id: str = "gestion-documental"):
        manifest = AGENTS_BY_ID.get(agent_id)
        if not manifest:
            raise HTTPException(404, {"error": "agent_not_found", "message": f"No existe el agente {agent_id}."})
        email_id = email_id or manifest.default_scenario or MAIN_EMAIL
        email = db().one("SELECT * FROM emails WHERE id=?", (email_id,))
        if not email:
            raise HTTPException(404, {"error": "email_not_found", "message": f"No existe el correo {email_id}."})
        atts = db().all("SELECT id, position, filename, mime_type, size_bytes, pages FROM attachments WHERE email_id=? ORDER BY position", (email_id,))
        for a in atts:
            a["preview_url"] = f"/api/files/{a['id']}/preview"
            a["original_url"] = f"/api/files/{a['id']}/original"
        firm = db().one("SELECT name, city FROM firm")
        minutes = {"presupuestos": {"manual_minutes": settings.quote_manual_minutes, "review_minutes": settings.quote_review_minutes},
                   "renovaciones": {"manual_minutes": settings.renewal_manual_minutes, "review_minutes": settings.renewal_review_minutes},
                   "auditor-facturas": {"manual_minutes": settings.audit_manual_minutes, "review_minutes": settings.audit_review_minutes},
                   }.get(agent_id, {"manual_minutes": settings.manual_minutes, "review_minutes": settings.review_minutes})
        return {"agent_id": agent_id, "firm": firm, "email": email, "attachments": atts, "assumptions": minutes,
                "sources": [light(d) for d in build_sources(db(), agent_id, email)], "latest_recorded_run": _latest_recorded(email_id)}

    def _source(agent_id: str, email_id: str | None, source_id: str) -> dict:
        manifest = AGENTS_BY_ID.get(agent_id)
        if not manifest:
            raise HTTPException(404, {"error": "agent_not_found", "message": f"No existe el agente {agent_id}."})
        eid = email_id or manifest.default_scenario or MAIN_EMAIL
        email = db().one("SELECT * FROM emails WHERE id=?", (eid,))
        if not email:
            raise HTTPException(404, {"error": "email_not_found", "message": f"No existe el correo {eid}."})
        doc = next((d for d in build_sources(db(), agent_id, email) if d["id"] == source_id), None)
        if not doc:
            raise HTTPException(404, {"error": "source_not_found", "message": "Documento no encontrado."})
        return doc

    @app.get("/api/sources/{source_id}")
    def source(source_id: str, agent_id: str = "gestion-documental", email_id: str | None = None):
        return _source(agent_id, email_id, source_id)

    @app.get("/api/sources/{source_id}/pdf")
    def source_pdf(source_id: str, agent_id: str = "gestion-documental", email_id: str | None = None):
        doc = _source(agent_id, email_id, source_id)
        firm = db().one("SELECT name FROM firm")
        return Response(render_source_pdf(doc, firm["name"] if firm else "Kroomix"), media_type="application/pdf",
                        headers={"Content-Disposition": f'inline; filename="{source_id}.pdf"'})

    def _latest_recorded(email_id: str):
        return db().one("SELECT id, started_at, duration_ms, model FROM runs WHERE email_id=? AND status='completada' "
                        "ORDER BY started_at DESC LIMIT 1", (email_id,))

    @app.get("/api/quotes/{quote_id}/pdf")
    def quote_pdf(quote_id: str):
        path = settings.quotes_dir / f"{quote_id}.pdf"
        if not quote_id.startswith("PRE-") or "/" in quote_id or not path.exists():
            raise HTTPException(404, {"error": "quote_not_found", "message": "Presupuesto no encontrado."})
        return FileResponse(path, media_type="application/pdf", headers={"Content-Disposition": f'inline; filename="Presupuesto-{quote_id}.pdf"'})

    @app.get("/api/files/{attachment_id}/{variant}")
    def file(attachment_id: str, variant: str):
        att = db().one("SELECT * FROM attachments WHERE id=?", (attachment_id,))
        if not att or variant not in ("preview", "original"):
            raise HTTPException(404, {"error": "file_not_found", "message": "Fichero no encontrado."})
        rel = att["preview_path"] if variant == "preview" else att["file_path"]
        media = "image/png" if variant == "preview" else att["mime_type"]
        return FileResponse(settings.files_dir / rel, media_type=media,
                            headers={"Content-Disposition": f"inline; filename=\"{att['filename'] if variant == 'original' else att['id'] + '.png'}\""})

    @app.post("/api/runs", status_code=202)
    async def start_run(body: StartRun):
        email_id = body.email_id
        try:
            run_id = app.state.runs.start(email_id, body.agent_id)
        except KeyError:  # (subclase de LookupError: debe ir antes) correo inexistente
            raise HTTPException(404, {"error": "email_not_found", "message": f"No existe el correo {email_id}."})
        except LookupError:
            raise HTTPException(404, {"error": "agent_not_found", "message": f"No existe el agente {body.agent_id}."})
        except AgentUnavailable:
            raise HTTPException(409, {"error": "agent_unavailable", "message": "Este agente todavía no está disponible."})
        except RunBusy as e:
            raise HTTPException(409, {"error": "run_in_progress", "message": "Ya hay una ejecución en curso.", "run_id": str(e)})
        return {"run_id": run_id, "events_url": f"/api/runs/{run_id}/events"}

    @app.post("/api/chat")
    async def chat(body: ChatMessage):
        text = body.message.strip()
        if not text:
            raise HTTPException(422, {"error": "empty_message", "message": "Escribe qué necesitas."})
        runs = app.state.runs
        try:
            outcome = await app.state.coordinator.handle(text, lambda agent_id: runs.start(None, agent_id))
        except Exception:  # noqa: BLE001
            logging.getLogger("kroomix.api").exception("coordinator failed")
            raise HTTPException(502, {"error": "coordinator_unavailable",
                                      "message": "No se ha podido conectar con el servicio de IA. Comprueba la conexión a internet."})
        out = {"action": outcome.action, "reply": outcome.reply, "agent_id": outcome.agent_id, "run_id": outcome.run_id,
               "events_url": f"/api/runs/{outcome.run_id}/events" if outcome.run_id else None}
        return out

    @app.get("/api/inbox")
    def inbox():
        return {"enabled": settings.inbox_enabled, "alias": settings.imap_alias if settings.inbox_enabled else None,
                "items": app.state.inbox.list()}

    @app.post("/api/inbox/{email_id}/launch", status_code=202)
    async def inbox_launch(email_id: str, body: InboxLaunch):
        try:
            run_id = app.state.inbox.launch_manual(email_id, body.agent_id)
        except KeyError:
            raise HTTPException(404, {"error": "email_not_found", "message": "Ese correo no está en la bandeja."})
        except LookupError:
            raise HTTPException(404, {"error": "agent_not_found", "message": f"No existe el agente {body.agent_id}."})
        except AgentUnavailable:
            raise HTTPException(409, {"error": "agent_unavailable", "message": "Este agente todavía no está disponible."})
        except RunBusy as e:
            raise HTTPException(409, {"error": "run_in_progress", "message": "Ya hay una ejecución en curso.", "run_id": str(e)})
        return {"run_id": run_id, "events_url": f"/api/runs/{run_id}/events"}

    @app.get("/api/runs/{run_id}")
    def get_run(run_id: str):
        run = db().one("SELECT * FROM runs WHERE id=?", (run_id,))
        if not run:
            raise HTTPException(404, {"error": "run_not_found", "message": "Ejecución no encontrada."})
        return run

    def _stored_events(run_id: str, after: int = 0) -> list[dict]:
        rows = db().all("SELECT seq, t_ms, type, payload FROM run_events WHERE run_id=? AND seq>? ORDER BY seq", (run_id, after))
        events = [{**r, "payload": json.loads(r["payload"])} for r in rows]
        for ev in events:  # grabaciones anteriores a esta cifra: se completa desde el coste guardado de la ejecución
            if ev["type"] == "run_finished" and "ai_cost_eur" not in ev["payload"]:
                run = db().one("SELECT cost_usd FROM runs WHERE id=?", (run_id,))
                cost = run["cost_usd"] if run else None
                ev["payload"]["ai_cost_eur"] = round(cost * settings.usd_eur, 4) if cost else None
        return events

    @app.get("/api/runs/{run_id}/events.json")
    def events_json(run_id: str):
        run = get_run(run_id)
        return {"run": run, "events": _stored_events(run_id)}

    @app.get("/api/runs/{run_id}/events")
    async def events_stream(run_id: str, after: int = 0):
        get_run(run_id)
        bus = app.state.runs.buses.get(run_id)

        async def gen():
            q = bus.subscribe() if bus and not bus.closed else None
            last = after
            try:
                for ev in _stored_events(run_id, after):
                    last = ev["seq"]
                    yield f"id: {ev['seq']}\nevent: message\ndata: {json.dumps(ev, ensure_ascii=False)}\n\n"
                while q is not None:
                    try:
                        ev = await asyncio.wait_for(q.get(), timeout=15)
                    except asyncio.TimeoutError:
                        yield ": keep-alive\n\n"
                        continue
                    if ev is None:
                        break
                    if ev["seq"] <= last:
                        continue
                    last = ev["seq"]
                    yield f"id: {ev['seq']}\nevent: message\ndata: {json.dumps(ev, ensure_ascii=False)}\n\n"
                yield "event: end\ndata: {}\n\n"
            finally:
                if q is not None:
                    bus.unsubscribe(q)

        return StreamingResponse(gen(), media_type="text/event-stream",
                                 headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

    def _draft(draft_id: str) -> dict:
        d = db().one("SELECT * FROM email_drafts WHERE id=?", (draft_id,))
        if not d:
            raise HTTPException(404, {"error": "draft_not_found", "message": "Borrador no encontrado."})
        return d

    def _draft_action(draft_id: str, action: str, status: str, body: str | None = None) -> dict:
        d = _draft(draft_id)
        ts = now_iso()
        db().execute("INSERT INTO draft_actions VALUES (?,?,?,?)", (draft_id, action, body, ts))
        db().execute("UPDATE email_drafts SET status=?, updated_at=? WHERE id=?", (status, ts, draft_id))
        db().execute("INSERT INTO audit_log VALUES (?,?,?,?,?,?)", (d["case_id"], None, ts, "empleado", f"borrador:{action}", json.dumps({"draft_id": draft_id})))
        return {**_draft(draft_id), "sent": False}

    @app.get("/api/drafts/{draft_id}")
    def get_draft(draft_id: str):
        return {**_draft(draft_id), "actions": db().all("SELECT action, body, at FROM draft_actions WHERE draft_id=? ORDER BY at", (draft_id,))}

    @app.put("/api/drafts/{draft_id}")
    def edit_draft(draft_id: str, body: DraftEdit):
        d = _draft(draft_id)
        if d["status"] in ("aprobado", "rechazado"):
            raise HTTPException(409, {"error": "draft_closed", "message": f"El borrador ya está {d['status']}."})
        db().execute("UPDATE email_drafts SET subject=?, body=? WHERE id=?", (body.subject, body.body, draft_id))
        return _draft_action(draft_id, "editar", "editado", body.body)

    @app.post("/api/drafts/{draft_id}/approve")
    def approve_draft(draft_id: str):
        if _draft(draft_id)["status"] == "rechazado":
            raise HTTPException(409, {"error": "draft_closed", "message": "El borrador ya está rechazado."})
        return _draft_action(draft_id, "aprobar", "aprobado")

    @app.post("/api/drafts/{draft_id}/reject")
    def reject_draft(draft_id: str):
        if _draft(draft_id)["status"] == "aprobado":
            raise HTTPException(409, {"error": "draft_closed", "message": "El borrador ya está aprobado."})
        return _draft_action(draft_id, "rechazar", "rechazado")

    if FRONTEND_DIST.exists():
        app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

    return app


app = create_app()
