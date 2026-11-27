"""Acceso con usuario/contraseña y trazabilidad del uso de cada cliente."""

import json
from dataclasses import replace

import pytest

from app.auth.store import AuthStore
from test_api import make_client


@pytest.fixture
def secured(db, settings, monkeypatch):
    s = replace(settings, auth_enabled=True)
    store = AuthStore(db)
    store.create_user("admin", "Admin", role="admin", password="admin-pass-1")
    store.create_user("acme", "Ana", "ACME SL", password="acme-pass-1")
    with make_client(db, s, monkeypatch) as c:
        yield c, db


def login(c, user, pw):
    return c.post("/api/auth/login", json={"username": user, "password": pw})


def test_api_requires_login_but_health_is_public(secured):
    c, _ = secured
    assert c.get("/api/health").status_code == 200
    for path in ("/api/agents", "/api/scenario", "/api/runs/x", "/api/admin/users"):
        assert c.get(path).status_code == 401
    assert c.post("/api/chat", json={"message": "hola"}).status_code == 401


def test_wrong_password_rejected_and_logged_and_locked(secured):
    c, db = secured
    for _ in range(5):
        assert login(c, "acme", "mala").status_code == 401
    assert login(c, "acme", "acme-pass-1").status_code == 429  # bloqueado aunque acierte
    assert db.one("SELECT COUNT(*) AS n FROM activity WHERE kind='login_failed'")["n"] == 6


def test_client_actions_are_traced_without_password(secured):
    c, db = secured
    assert login(c, "acme", "acme-pass-1").status_code == 200
    assert c.get("/api/agents").status_code == 200
    assert c.get("/api/scenario?agent_id=presupuestos").status_code == 200
    run = c.post("/api/runs", json={"agent_id": "gestion-documental"})
    assert run.status_code == 202
    rows = db.all("SELECT * FROM activity WHERE username='acme' ORDER BY id")
    kinds = [r["kind"] for r in rows]
    assert kinds[0] == "login" and kinds.count("api") == 3
    started = next(r for r in rows if r["path"] == "/api/runs")
    assert started["run_id"] == run.json()["run_id"] and "gestion-documental" in started["summary"]
    assert "presupuestos" in next(r for r in rows if r["path"].startswith("/api/scenario"))["summary"]
    assert "acme-pass-1" not in json.dumps(rows)  # la contraseña nunca llega al registro


def test_client_cannot_see_admin_or_inbox_but_admin_sees_everything(secured):
    c, _ = secured
    login(c, "acme", "acme-pass-1")
    assert c.get("/api/admin/users").status_code == 403
    assert c.get("/api/admin/activity").status_code == 403
    assert c.get("/api/inbox").json() == {"enabled": False, "alias": None, "items": []}
    assert c.post("/api/inbox/x/launch", json={"agent_id": "presupuestos"}).status_code == 403
    c.post("/api/chat", json={"message": "quiero un presupuesto"})
    c.post("/api/auth/logout")
    assert c.get("/api/agents").status_code == 401  # la sesión ya no vale

    login(c, "admin", "admin-pass-1")
    users = {u["username"]: u for u in c.get("/api/admin/users").json()["users"]}
    assert users["acme"]["logins"] == 1 and users["acme"]["chats"] == 1
    acme_id = users["acme"]["id"]
    items = c.get(f"/api/admin/activity?user_id={acme_id}").json()["items"]
    assert {"login", "logout", "api"} <= {i["kind"] for i in items}
    chat = next(i for i in items if i["path"] == "/api/chat")
    detail = c.get(f"/api/admin/activity/{chat['id']}").json()
    assert "quiero un presupuesto" in detail["request"]


def test_deactivating_kills_sessions_and_admin_can_create_and_reset(secured):
    c, _ = secured
    login(c, "admin", "admin-pass-1")
    created = c.post("/api/admin/users", json={"username": "nuevo", "display_name": "N", "company": "X"}).json()
    assert len(created["password"]) >= 8
    assert c.post("/api/admin/users", json={"username": "nuevo"}).status_code == 409
    assert c.post("/api/admin/users", json={"username": "A B"}).status_code == 422
    uid = created["user"]["id"]
    other = c.__class__(c.app)  # segundo cliente = segunda sesión
    with other:
        assert login(other, "nuevo", created["password"]).status_code == 200
        assert c.patch(f"/api/admin/users/{uid}", json={"active": False}).status_code == 200
        assert other.get("/api/agents").status_code == 401
        assert login(other, "nuevo", created["password"]).status_code == 401
    new_pw = c.post(f"/api/admin/users/{uid}/reset-password").json()["password"]
    c.patch(f"/api/admin/users/{uid}", json={"active": True})
    with c.__class__(c.app) as again:
        assert login(again, "nuevo", new_pw).status_code == 200
    me = c.get("/api/auth/me").json()["user"]
    assert c.patch(f"/api/admin/users/{me['id']}", json={"active": False}).status_code == 409


def test_ui_events_are_recorded(secured):
    c, db = secured
    login(c, "acme", "acme-pass-1")
    assert c.post("/api/track", json={"event": "open_guide", "detail": {"label": "Abrió la guía"}}).status_code == 204
    assert db.one("SELECT summary FROM activity WHERE kind='ui'")["summary"] == "Abrió la guía"
