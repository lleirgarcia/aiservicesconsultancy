"""Traduce una petición a una frase legible para el administrador."""

from __future__ import annotations

import json
import re

_RUN = re.compile(r"^/api/runs/([^/]+)(?:/(events|events\.json))?$")


def _j(raw: str | None) -> dict:
    try:
        v = json.loads(raw or "")
        return v if isinstance(v, dict) else {}
    except ValueError:
        return {}


def describe(method: str, path: str, query: str, req: str | None, resp: str | None) -> tuple[str, str | None]:
    """(resumen, run_id). El run_id sale de la ruta o de la respuesta (POST /api/runs, chat, bandeja)."""
    rq, rs = _j(req), _j(resp)
    run_id = rs.get("run_id") if isinstance(rs.get("run_id"), str) else None
    if m := _RUN.match(path):
        run_id = m.group(1)
        what = {"events": "Siguió en directo la ejecución", "events.json": "Reprodujo la grabación de la ejecución", None: "Consultó la ejecución"}[m.group(2)]
        return f"{what} {run_id}", run_id
    if method == "POST" and path == "/api/runs":
        return f"Ejecutó el agente «{rq.get('agent_id', 'gestion-documental')}»" + (f" con el correo {rq['email_id']}" if rq.get("email_id") else ""), run_id
    if method == "POST" and path == "/api/chat":
        act = "lanzó el agente " + str(rs.get("agent_id")) if rs.get("action") == "launched" else "respondió el coordinador"
        return f"Chat: «{str(rq.get('message', ''))[:200]}» → {act}", run_id
    if path == "/api/agents":
        return "Cargó la plataforma (lista de agentes)", None
    if path.startswith("/api/agents/"):
        return f"Consultó la ficha del agente {path.rsplit('/', 1)[-1]}", None
    if path == "/api/scenario":
        agent = dict(p.split("=", 1) for p in query.split("&") if "=" in p).get("agent_id", "gestion-documental")
        return f"Abrió el espacio de trabajo del agente «{agent}»", None
    if m := re.match(r"^/api/sources/([^/]+)(/pdf)?$", path):
        return f"{'Descargó el PDF' if m.group(2) else 'Abrió el documento'} {m.group(1)}", None
    if m := re.match(r"^/api/quotes/([^/]+)/pdf$", path):
        return f"Abrió el presupuesto {m.group(1)}", None
    if m := re.match(r"^/api/files/([^/]+)/(preview|original)$", path):
        return f"Vio el adjunto {m.group(1)} ({'vista previa' if m.group(2) == 'preview' else 'original'})", None
    if m := re.match(r"^/api/inbox/([^/]+)/launch$", path):
        return f"Lanzó el agente «{rq.get('agent_id')}» desde la bandeja", run_id
    if m := re.match(r"^/api/drafts/([^/]+)(/approve|/reject)?$", path):
        verb = {"POST/approve": "Aprobó", "POST/reject": "Rechazó", "PUT": "Editó", "GET": "Consultó"}.get(f"{method}{m.group(2) or ''}", method)
        return f"{verb} el borrador {m.group(1)}", None
    return f"{method} {path}", None
