"""Gestión de usuarios desde la terminal.

  uv run python -m app.auth.cli create <usuario> [--admin] [--name "Nombre"] [--company "Empresa"] [--password ...]
  uv run python -m app.auth.cli passwd <usuario> [--password ...]
  uv run python -m app.auth.cli list
Sin --password se genera una y se muestra una sola vez.
"""

from __future__ import annotations

import argparse
import sys

from app.auth.store import AuthStore
from app.config import get_settings
from app.persistence.db import Database


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="app.auth.cli")
    sub = ap.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("create"); c.add_argument("username"); c.add_argument("--admin", action="store_true")
    c.add_argument("--name", default=""); c.add_argument("--company", default=""); c.add_argument("--password")
    p = sub.add_parser("passwd"); p.add_argument("username"); p.add_argument("--password")
    sub.add_parser("list")
    a = ap.parse_args(argv)
    s = get_settings()
    store = AuthStore(Database(s.db_path))
    if a.cmd == "create":
        try:
            user, pw = store.create_user(a.username, a.name, a.company, "admin" if a.admin else "client", a.password)
        except (ValueError, KeyError) as e:
            print(f"Error: {e if isinstance(e, ValueError) else 'ese usuario ya existe'}", file=sys.stderr)
            return 1
        print(f"Creado «{user['username']}» ({user['role']}). Contraseña (solo se muestra ahora): {pw}")
    elif a.cmd == "passwd":
        user = store.user_by_name(a.username)
        if not user:
            print("No existe ese usuario.", file=sys.stderr)
            return 1
        print(f"Nueva contraseña de «{user['username']}» (solo se muestra ahora): {store.reset_password(user['id'], a.password)}")
    else:
        for u in store.users_with_stats():
            print(f"{u['id']:>3}  {u['username']:<20} {u['role']:<7} {'activo' if u['active'] else 'INACTIVO':<8} acciones={u['actions']} última={u['last_activity'] or '-'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
