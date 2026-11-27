"""Middleware ASGI: exige sesión en /api/* y deja traza de todo lo que hace cada usuario.

Es ASGI puro (no BaseHTTPMiddleware) para no romper ni almacenar en búfer el streaming SSE de las ejecuciones.
"""

from __future__ import annotations

import json
import logging
import re
import time
from http.cookies import SimpleCookie

from starlette.responses import JSONResponse

from app.auth.describe import describe

log = logging.getLogger("kroomix.auth")
COOKIE = "kroomix_session"
MAX_BODY = 4000  # bytes guardados por petición/respuesta
_SECRET = re.compile(r"pass|secret|token", re.I)
# Ruido que no aporta: sondeos periódicos y comprobaciones. Las rutas /api/auth/* y /api/track se registran por su cuenta.
_SKIP = {("GET", "/api/health"), ("GET", "/api/inbox")}


def client_ip(scope, trust_proxy: bool) -> str:
    if trust_proxy:
        h = dict(scope["headers"])
        # x-client-ip lo pone la web (Vercel) y no lo toca el proxy intermedio; x-forwarded-for puede venir sobrescrito.
        fwd = (h.get(b"x-client-ip") or h.get(b"x-forwarded-for", b"")).decode().split(",")[0].strip()
        if fwd:
            return fwd
    return (scope.get("client") or ("", 0))[0]


def is_https(scope, trust_proxy: bool) -> bool:
    if trust_proxy and dict(scope["headers"]).get(b"x-forwarded-proto", b"") == b"https":
        return True
    return scope.get("scheme") == "https"


def _redact(raw: bytes) -> str | None:
    if not raw:
        return None
    text = raw[:MAX_BODY * 2].decode("utf-8", "replace")
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            data = {k: ("***" if _SECRET.search(k) else v) for k, v in data.items()}
        return json.dumps(data, ensure_ascii=False)[:MAX_BODY]
    except ValueError:
        return text[:MAX_BODY]


class AuthActivityMiddleware:
    def __init__(self, app, fastapi_app, settings):
        self.app, self.fa, self.settings = app, fastapi_app, settings

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        if scope["type"] != "http" or not path.startswith("/api/") or not self.settings.auth_enabled:
            return await self.app(scope, receive, send)
        method = scope["method"]
        store = self.fa.state.store
        cookies = SimpleCookie(dict(scope["headers"]).get(b"cookie", b"").decode())
        found = store.session(cookies[COOKIE].value) if COOKIE in cookies else None
        user, session_id = found if found else (None, None)
        scope.setdefault("state", {})["user"] = user
        scope["state"]["session_id"] = session_id

        public = (method == "POST" and path == "/api/auth/login") or (method, path) == ("GET", "/api/health")
        if not user and not public:
            return await JSONResponse({"detail": {"error": "unauthenticated", "message": "Inicia sesión para continuar."}}, status_code=401)(scope, receive, send)
        if path.startswith("/api/admin") and (not user or user["role"] != "admin"):
            return await JSONResponse({"detail": {"error": "forbidden", "message": "Solo el administrador puede ver esto."}}, status_code=403)(scope, receive, send)
        if public or path.startswith(("/api/auth/", "/api/admin", "/api/track")) or (method, path) in _SKIP:
            return await self.app(scope, receive, send)

        req = bytearray()
        resp = bytearray()
        state = {"status": 0, "json": False}

        async def recv():
            msg = await receive()
            if msg["type"] == "http.request" and len(req) < MAX_BODY * 2:
                req.extend(msg.get("body", b""))
            return msg

        async def snd(msg):
            if msg["type"] == "http.response.start":
                state["status"] = msg["status"]
                state["json"] = any(k == b"content-type" and b"json" in v for k, v in msg["headers"])
            elif msg["type"] == "http.response.body" and state["json"] and method in ("POST", "PUT") and len(resp) < MAX_BODY:
                resp.extend(msg.get("body", b""))
            await send(msg)

        t0 = time.monotonic()
        try:
            await self.app(scope, recv, snd)
        finally:
            try:
                request_text = _redact(bytes(req))
                response_text = bytes(resp[:MAX_BODY]).decode("utf-8", "replace") or None
                query = scope.get("query_string", b"").decode()
                summary, run_id = describe(method, path, query, request_text, response_text)
                store.log(kind="api", user=user, session_id=session_id, method=method, path=path + (f"?{query}" if query else ""),
                          status=state["status"], duration_ms=int((time.monotonic() - t0) * 1000), ip=client_ip(scope, self.settings.trust_proxy),
                          user_agent=dict(scope["headers"]).get(b"user-agent", b"").decode("latin-1"), summary=summary,
                          request=request_text, response=response_text, run_id=run_id)
            except Exception:  # noqa: BLE001 — registrar nunca debe romper la petición
                log.exception("no se pudo registrar la actividad")
