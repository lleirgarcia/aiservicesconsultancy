"""Ejecuta el agente desde la terminal y muestra la traza de negocio.

Uso: uv run python -m app.agent.cli [agente] [email_id]   (por defecto: gestion-documental)
"""

from __future__ import annotations

import asyncio
import json
import sys

from app.config import get_settings
from app.persistence.db import Database

from .orchestrator import RunManager


async def main(agent_id: str, email_id: str | None) -> None:
    s = get_settings()
    db = Database(s.db_path)
    mgr = RunManager(db, s)
    run_id = mgr.start(email_id, agent_id)
    q = mgr.buses[run_id].subscribe()
    while (ev := await q.get()) is not None:
        p = ev["payload"]
        t = f"{ev['t_ms'] / 1000:6.1f}s"
        if ev["type"] == "activity_finished":
            print(f"{t} [{p['status']:6}] {p['label']}" + (f" — {p['detail']}" if p.get("detail") else ""))
        elif ev["type"] == "run_finished":
            print(f"{t} FIN {p['status']} {p.get('error') or ''}")
            if p.get("case"):
                c = p["case"]
                if "audit_id" in c:
                    print("Totales:", json.dumps(c["totals"], ensure_ascii=False))
                    print("Facturas:", [(x["number"], x["action"], [f["kind"] for f in x["findings"]]) for x in c["invoices"]])
                elif "renewal_id" in c:
                    print("Totales:", json.dumps(c["totals"], ensure_ascii=False))
                    print("Pólizas:", [(x["policy_id"], x["recommendation"], x["flags"]) for x in c["policies"]])
                elif "quote_id" in c:
                    print("Totales:", json.dumps(c["totals"], ensure_ascii=False))
                    print("Líneas:", [(l["service_id"], l["quantity"], l["subtotal"]) for l in c["lines"]])
                    print("Margen interno:", c["internal"] and c["internal"]["margin_pct"])
                else:
                    print(json.dumps({k: c[k] for k in ("valid_count", "duplicate_count", "review_count", "totals")}, ensure_ascii=False))
                print("Incidencias:", [(i.get("kind") or i.get("type"), i["title"]) for i in c["incidents"]])
                print("Tareas:", [x["title"] for x in c["review_tasks"]])
                print("Borrador:", (c["email_draft"] or {}).get("body"))
    run = db.one("SELECT * FROM runs WHERE id=?", (run_id,))
    print("coste equivalente:", run["cost_usd"], "turnos:", run["turns"])


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else "gestion-documental", sys.argv[2] if len(sys.argv) > 2 else None))
