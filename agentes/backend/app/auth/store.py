"""Usuarios, sesiones y registro de actividad (SQLite)."""

from __future__ import annotations

import re
import time
from datetime import datetime, timedelta, timezone

from app.auth.security import generate_password, hash_password, new_token, token_hash, verify_password
from app.persistence.db import Database

USERNAME_RE = re.compile(r"^[a-z0-9._-]{3,40}$")
PUBLIC_FIELDS = "id, username, display_name, company, role, active, created_at, last_login_at"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class AuthStore:
    def __init__(self, db: Database, session_ttl_h: int = 12, max_failures: int = 5, lock_s: int = 900):
        self.db, self.ttl_h, self.max_failures, self.lock_s = db, session_ttl_h, max_failures, lock_s
        self._failures: dict[str, list[float]] = {}  # (ip|usuario) -> instantes de fallos recientes

    # --- usuarios -------------------------------------------------------------
    def create_user(self, username: str, display_name: str = "", company: str = "", role: str = "client",
                    password: str | None = None) -> tuple[dict, str]:
        username = username.strip().lower()
        if not USERNAME_RE.match(username):
            raise ValueError("El usuario debe tener 3-40 caracteres: minúsculas, números, punto, guion o guion bajo.")
        if role not in ("client", "admin"):
            raise ValueError("Rol inválido.")
        if self.db.one("SELECT 1 AS x FROM users WHERE username=?", (username,)):
            raise KeyError(username)
        password = password or generate_password()
        if len(password) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        self.db.execute("INSERT INTO users (username, display_name, company, password_hash, role, active, created_at) VALUES (?,?,?,?,?,1,?)",
                        (username, display_name.strip() or username, company.strip(), hash_password(password), role, _now()))
        return self.user_by_name(username), password

    def user_by_name(self, username: str) -> dict | None:
        return self.db.one(f"SELECT {PUBLIC_FIELDS} FROM users WHERE username=?", (username.strip().lower(),))

    def get_user(self, user_id: int) -> dict | None:
        return self.db.one(f"SELECT {PUBLIC_FIELDS} FROM users WHERE id=?", (user_id,))

    def set_active(self, user_id: int, active: bool) -> None:
        self.db.execute("UPDATE users SET active=? WHERE id=?", (1 if active else 0, user_id))
        if not active:
            self.db.execute("DELETE FROM sessions WHERE user_id=?", (user_id,))

    def reset_password(self, user_id: int, password: str | None = None) -> str:
        password = password or generate_password()
        if len(password) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres.")
        self.db.execute("UPDATE users SET password_hash=? WHERE id=?", (hash_password(password), user_id))
        self.db.execute("DELETE FROM sessions WHERE user_id=?", (user_id,))
        return password

    def has_admin(self) -> bool:
        return bool(self.db.one("SELECT 1 AS x FROM users WHERE role='admin' AND active=1"))

    # --- inicio de sesión -------------------------------------------------------
    def _recent_failures(self, key: str) -> list[float]:
        now = time.time()
        self._failures[key] = [t for t in self._failures.get(key, []) if now - t < self.lock_s]
        return self._failures[key]

    def locked(self, ip: str, username: str) -> bool:
        return (len(self._recent_failures(f"ip:{ip}")) >= self.max_failures * 4
                or len(self._recent_failures(f"user:{username.strip().lower()}")) >= self.max_failures)

    def login(self, username: str, password: str, ip: str, user_agent: str) -> tuple[dict, str] | None:
        username = username.strip().lower()
        row = self.db.one("SELECT * FROM users WHERE username=?", (username,))
        ok = verify_password(password, row["password_hash"] if row else None) and bool(row and row["active"])
        if not ok:
            self._failures.setdefault(f"ip:{ip}", []).append(time.time())
            self._failures.setdefault(f"user:{username}", []).append(time.time())
            return None
        self._failures.pop(f"user:{username}", None)
        token = new_token()
        now = _now()
        expires = (datetime.now(timezone.utc) + timedelta(hours=self.ttl_h)).isoformat(timespec="seconds")
        self.db.execute("INSERT INTO sessions (token_hash, user_id, created_at, expires_at, last_seen_at, ip, user_agent) VALUES (?,?,?,?,?,?,?)",
                        (token_hash(token), row["id"], now, expires, now, ip, user_agent[:300]))
        self.db.execute("UPDATE users SET last_login_at=? WHERE id=?", (now, row["id"]))
        return self.get_user(row["id"]), token

    def session(self, token: str) -> tuple[dict, int] | None:
        """Usuario y id de sesión de un token válido (no caducado, usuario activo)."""
        row = self.db.one("SELECT s.id AS sid, s.expires_at, u.* FROM sessions s JOIN users u ON u.id=s.user_id "
                          "WHERE s.token_hash=? AND u.active=1", (token_hash(token),))
        if not row or row["expires_at"] < _now():
            return None
        self.db.execute("UPDATE sessions SET last_seen_at=? WHERE id=?", (_now(), row["sid"]))
        return {k: row[k] for k in ("id", "username", "display_name", "company", "role", "active", "created_at", "last_login_at")}, row["sid"]

    def logout(self, token: str) -> None:
        self.db.execute("DELETE FROM sessions WHERE token_hash=?", (token_hash(token),))

    # --- actividad --------------------------------------------------------------
    def log(self, *, kind: str, user: dict | None = None, username: str | None = None, session_id: int | None = None,
            method: str = "", path: str = "", status: int | None = None, duration_ms: int | None = None, ip: str = "",
            user_agent: str = "", summary: str = "", request: str | None = None, response: str | None = None,
            run_id: str | None = None) -> None:
        self.db.execute(
            "INSERT INTO activity (at, user_id, username, session_id, kind, method, path, status, duration_ms, ip, user_agent, summary, request, response, run_id) "
            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (_now(), user["id"] if user else None, (user or {}).get("username") or username, session_id, kind, method, path, status,
             duration_ms, ip, user_agent[:300], summary[:500], request, response, run_id))

    def users_with_stats(self) -> list[dict]:
        return self.db.all(
            f"SELECT u.id, u.username, u.display_name, u.company, u.role, u.active, u.created_at, u.last_login_at, "
            "(SELECT COUNT(*) FROM sessions s WHERE s.user_id=u.id AND s.expires_at>?) AS open_sessions, "
            "(SELECT COUNT(*) FROM activity a WHERE a.user_id=u.id AND a.kind='login') AS logins, "
            "(SELECT COUNT(*) FROM activity a WHERE a.user_id=u.id AND a.kind IN ('api','ui')) AS actions, "
            "(SELECT COUNT(DISTINCT a.run_id) FROM activity a WHERE a.user_id=u.id AND a.kind='api' AND a.method='POST' AND a.run_id IS NOT NULL) AS runs, "
            "(SELECT COUNT(*) FROM activity a WHERE a.user_id=u.id AND a.path='/api/chat' AND a.method='POST') AS chats, "
            "(SELECT MAX(a.at) FROM activity a WHERE a.user_id=u.id) AS last_activity "
            "FROM users u ORDER BY u.role, COALESCE(last_activity, u.created_at) DESC", (_now(),))

    def activity(self, user_id: int | None = None, kind: str | None = None, before_id: int | None = None,
                 q: str | None = None, limit: int = 100) -> list[dict]:
        where, params = ["1=1"], []
        if user_id is not None:
            where.append("user_id=?"); params.append(user_id)
        if kind:
            where.append("kind=?"); params.append(kind)
        if before_id:
            where.append("id<?"); params.append(before_id)
        if q:
            where.append("(summary LIKE ? OR path LIKE ? OR username LIKE ?)"); params += [f"%{q}%"] * 3
        params.append(max(1, min(limit, 500)))
        return self.db.all("SELECT id, at, user_id, username, session_id, kind, method, path, status, duration_ms, ip, summary, run_id "
                           f"FROM activity WHERE {' AND '.join(where)} ORDER BY id DESC LIMIT ?", tuple(params))

    def activity_detail(self, activity_id: int) -> dict | None:
        return self.db.one("SELECT * FROM activity WHERE id=?", (activity_id,))
