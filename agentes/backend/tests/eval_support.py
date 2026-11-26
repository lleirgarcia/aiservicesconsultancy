"""Soporte común de las evaluaciones con el agente real: ejecución sobre una copia de la BD y lectura del resultado."""

import asyncio
import json
import shutil
from dataclasses import replace

import pytest

from app.agent.orchestrator import RunManager
from app.config import DATA_DIR, Settings
from app.persistence.db import Database


def make_runner(tmp_path_factory):
    """Devuelve run(email_id, **settings) -> Result, con caché por (email, ajustes)."""
    src = DATA_DIR / "kroomix.db"
    if not src.exists():
        pytest.skip("Faltan los datos de demo")
    base = tmp_path_factory.mktemp("evals")
    cache: dict = {}

    def run(email_id: str, agent_id: str = "gestion-documental", **overrides):
        key = (email_id, agent_id, json.dumps(overrides, sort_keys=True, default=str))
        if key in cache:
            return cache[key]
        dst = base / f"{len(cache)}.db"
        shutil.copy(src, dst)
        db = Database(dst)
        for t in ("runs", "run_events", "cases", "extractions", "duplicate_checks", "case_documents", "incidents",
                  "review_tasks", "email_drafts", "draft_actions", "audit_log", "quote_lines", "renewal_reviews", "audit_reviews"):
            db.execute(f"DELETE FROM {t}")
        settings = replace(Settings(), db_path=dst, data_dir=DATA_DIR, quotes_dir_override=base / f"quotes-{len(cache)}", **overrides)

        async def go():
            mgr = RunManager(db, settings)
            run_id = mgr.start(email_id, agent_id)
            await mgr.tasks[run_id]
            return run_id

        run_id = asyncio.run(go())
        cache[key] = Result(db, run_id)
        return cache[key]

    return run


class Result:
    def __init__(self, db: Database, run_id: str):
        self.db, self.run_id = db, run_id
        self.run = db.one("SELECT * FROM runs WHERE id=?", (run_id,))
        self.case = db.one("SELECT * FROM cases WHERE run_id=?", (run_id,))
        cid = self.case["id"] if self.case else None
        q = lambda sql: db.all(sql, (cid,))  # noqa: E731
        self.docs = {d["attachment_id"]: d for d in q("SELECT * FROM case_documents WHERE case_id=?")}
        self.incidents = q("SELECT * FROM incidents WHERE case_id=?")
        self.tasks = q("SELECT * FROM review_tasks WHERE case_id=?")
        self.drafts = q("SELECT * FROM email_drafts WHERE case_id=?")
        self.audit = db.all("SELECT action FROM audit_log WHERE run_id=?", (run_id,))
        self.result = json.loads(self.case["result"]) if self.case and self.case["result"] else None

    def calls(self, tool: str) -> int:
        return sum(1 for a in self.audit if a["action"] == tool)

    def extraction(self, att_id: str) -> dict | None:
        row = self.db.one("SELECT data FROM extractions WHERE case_id=? AND attachment_id=? ORDER BY attempt DESC LIMIT 1",
                          (self.case["id"], att_id))
        return json.loads(row["data"]) if row else None


