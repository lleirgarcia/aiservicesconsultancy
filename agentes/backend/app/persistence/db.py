"""SQLite: conexión y esquema."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

SCHEMA = """
-- Datos de demostración (los crea seed/) -----------------------------------
CREATE TABLE IF NOT EXISTS firm (
    id TEXT PRIMARY KEY, name TEXT, tax_id TEXT, city TEXT, email TEXT
);
CREATE TABLE IF NOT EXISTS firm_rules (
    code TEXT PRIMARY KEY, title TEXT, body TEXT
);
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, legal_name TEXT, trade_name TEXT, tax_id TEXT,
    address TEXT, city TEXT, contact_name TEXT, contact_email TEXT,
    email_domain TEXT, sector TEXT, vat_regime TEXT, vat_period TEXT,
    irpf_regime TEXT, since TEXT
);
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY, name TEXT, tax_id TEXT, category TEXT, city TEXT
);
CREATE TABLE IF NOT EXISTS historical_documents (
    id TEXT PRIMARY KEY, client_id TEXT, supplier_id TEXT, period TEXT,
    issue_date TEXT, invoice_number TEXT, category TEXT, base_amount REAL,
    vat_rate REAL, vat_amount REAL, withholding_amount REAL, total_amount REAL,
    file_path TEXT, file_sha256 TEXT, status TEXT
);
CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY, scenario TEXT, from_name TEXT, from_address TEXT,
    to_address TEXT, subject TEXT, body TEXT, received_at TEXT, period TEXT
);
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY, email_id TEXT, position INTEGER, filename TEXT,
    mime_type TEXT, file_path TEXT, preview_path TEXT, size_bytes INTEGER,
    file_sha256 TEXT, pages INTEGER
);

-- Datos de demostración del agente de presupuestos (los crea seed/quotes.py) -----
CREATE TABLE IF NOT EXISTS service_catalog (
    id TEXT PRIMARY KEY, family TEXT, name TEXT, description TEXT, kind TEXT, unit TEXT,
    unit_price REAL, est_hours REAL, tier_min INTEGER, tier_max INTEGER, tier_label TEXT
);
CREATE TABLE IF NOT EXISTS quote_rules (
    code TEXT PRIMARY KEY, title TEXT, body TEXT
);
CREATE TABLE IF NOT EXISTS quote_lines (
    case_id TEXT, service_id TEXT, name TEXT, kind TEXT, family TEXT, unit TEXT, quantity REAL,
    unit_price REAL, subtotal REAL, est_hours REAL, source_text TEXT,
    PRIMARY KEY (case_id, service_id)
);

-- Datos de demostración del agente de renovaciones (los crea seed/renewals.py) ---
CREATE TABLE IF NOT EXISTS policies (
    id TEXT PRIMARY KEY, client_id TEXT, insurer TEXT, product TEXT, policy_number TEXT, renewal_date TEXT,
    annual_premium REAL, renewal_premium REAL, renewal_notes TEXT, coverage_reduced INTEGER, claims_12m INTEGER,
    commission_pct REAL
);
CREATE TABLE IF NOT EXISTS renewal_rules (
    code TEXT PRIMARY KEY, title TEXT, body TEXT
);
CREATE TABLE IF NOT EXISTS renewal_reviews (
    case_id TEXT, policy_id TEXT, recommendation TEXT, rationale TEXT, flags TEXT, days_left INTEGER,
    PRIMARY KEY (case_id, policy_id)
);

-- Datos de demostración del agente auditor de facturas (los crea seed/audit.py) ---
CREATE TABLE IF NOT EXISTS audit_documents (
    id TEXT PRIMARY KEY, kind TEXT, client_id TEXT, supplier_id TEXT, number TEXT, doc_date TEXT, po_ref TEXT,
    period TEXT, base REAL, vat REAL, total REAL
);
CREATE TABLE IF NOT EXISTS audit_lines (
    doc_id TEXT, item_code TEXT, description TEXT, quantity REAL, unit_price REAL
);
CREATE TABLE IF NOT EXISTS audit_rules (
    code TEXT PRIMARY KEY, title TEXT, body TEXT
);
CREATE TABLE IF NOT EXISTS audit_reviews (
    case_id TEXT, invoice_id TEXT, action TEXT, rationale TEXT, findings TEXT,
    PRIMARY KEY (case_id, invoice_id)
);

-- Correos recibidos de fuera (bandeja IMAP) ---
CREATE TABLE IF NOT EXISTS inbound_emails (
    message_id TEXT PRIMARY KEY, email_id TEXT, status TEXT, agent_id TEXT, run_id TEXT, note TEXT,
    attempts INTEGER DEFAULT 0, received_at TEXT, updated_at TEXT
);

-- Datos que produce el agente ----------------------------------------------
CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY, email_id TEXT, status TEXT, model TEXT,
    started_at TEXT, finished_at TEXT, duration_ms INTEGER, error TEXT,
    cost_usd REAL, turns INTEGER, case_id TEXT, agent_id TEXT
);
CREATE TABLE IF NOT EXISTS run_events (
    run_id TEXT, seq INTEGER, t_ms INTEGER, type TEXT, payload TEXT,
    PRIMARY KEY (run_id, seq)
);
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY, run_id TEXT, email_id TEXT, client_id TEXT,
    period TEXT, status TEXT, opened_at TEXT, closed_at TEXT, summary TEXT,
    result TEXT, UNIQUE (run_id, email_id)
);
CREATE TABLE IF NOT EXISTS extractions (
    case_id TEXT, attachment_id TEXT, attempt INTEGER, data TEXT,
    issues TEXT, blocking INTEGER, created_at TEXT,
    PRIMARY KEY (case_id, attachment_id, attempt)
);
CREATE TABLE IF NOT EXISTS duplicate_checks (
    case_id TEXT, attachment_id TEXT, is_duplicate INTEGER, result TEXT,
    PRIMARY KEY (case_id, attachment_id)
);
CREATE TABLE IF NOT EXISTS case_documents (
    case_id TEXT, attachment_id TEXT, status TEXT, category TEXT, folder TEXT,
    registered_at TEXT, PRIMARY KEY (case_id, attachment_id)
);
CREATE TABLE IF NOT EXISTS incidents (
    case_id TEXT, key TEXT, kind TEXT, title TEXT, detail TEXT,
    attachment_id TEXT, source TEXT, created_at TEXT,
    PRIMARY KEY (case_id, key)
);
CREATE TABLE IF NOT EXISTS review_tasks (
    id TEXT PRIMARY KEY, case_id TEXT, title TEXT, reason TEXT,
    attachment_id TEXT, priority TEXT, status TEXT, created_at TEXT,
    UNIQUE (case_id, title)
);
CREATE TABLE IF NOT EXISTS email_drafts (
    id TEXT PRIMARY KEY, case_id TEXT UNIQUE, to_address TEXT, subject TEXT,
    body TEXT, status TEXT, created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS draft_actions (
    draft_id TEXT, action TEXT, body TEXT, at TEXT
);
CREATE TABLE IF NOT EXISTS audit_log (
    case_id TEXT, run_id TEXT, at TEXT, actor TEXT, action TEXT, detail TEXT
);
"""


def connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, timeout=10, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    # Migración: las bases creadas antes de existir el catálogo de agentes no tienen runs.agent_id.
    cols = {r["name"] for r in conn.execute("PRAGMA table_info(runs)").fetchall()}
    if "agent_id" not in cols:
        conn.execute("ALTER TABLE runs ADD COLUMN agent_id TEXT")
        conn.execute("UPDATE runs SET agent_id='gestion-documental' WHERE agent_id IS NULL")
    from app.seed.quotes import ensure_quote_seed  # datos del agente de presupuestos (idempotente)
    ensure_quote_seed(conn)
    from app.seed.renewals import ensure_renewal_seed  # datos del agente de renovaciones (idempotente)
    ensure_renewal_seed(conn)
    from app.seed.audit import ensure_audit_seed  # datos del agente auditor de facturas (idempotente)
    ensure_audit_seed(conn)


class Database:
    """Envoltorio mínimo: una conexión por operación, filas como dict."""

    def __init__(self, path: Path):
        self.path = path
        with self.conn() as c:
            init_schema(c)

    @contextmanager
    def conn(self) -> Iterator[sqlite3.Connection]:
        c = connect(self.path)
        try:
            yield c
        finally:
            c.close()

    def all(self, sql: str, params: tuple | dict = ()) -> list[dict[str, Any]]:
        with self.conn() as c:
            return [dict(r) for r in c.execute(sql, params).fetchall()]

    def one(self, sql: str, params: tuple | dict = ()) -> dict[str, Any] | None:
        with self.conn() as c:
            r = c.execute(sql, params).fetchone()
            return dict(r) if r else None

    def execute(self, sql: str, params: tuple | dict = ()) -> int:
        with self.conn() as c:
            return c.execute(sql, params).rowcount


def dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, sort_keys=True)
