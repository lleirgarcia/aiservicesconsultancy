"""Los tests trabajan siempre sobre una copia de la base de datos, nunca sobre data/kroomix.db."""

from __future__ import annotations

import shutil
from dataclasses import replace

import pytest

from app.config import DATA_DIR, Settings
from app.events.bus import RunEventBus
from app.events.presenter import Presenter
from app.persistence.db import Database
from app.tools.base import RunContext, execute_tool
from app.tools.catalog import TOOLS_BY_NAME

from app.seed.dataset import CLIENTS, SUPPLIERS

MAIN = "email-martinez-nov"
CLIENT_TAX = CLIENTS["cli-martinez"].tax_id

# Lo que hay escrito en cada documento del escenario principal (lo que leería el agente).
MAIN_EXTRACTIONS = {
    "a1": dict(document_type="factura", category="suministro_electricidad", issuer_name="Energia Osona Comercialitzadora SA",
               issuer_tax_id=SUPPLIERS["sup-elec"].tax_id, recipient_tax_id=CLIENT_TAX, invoice_number="FE-2026-114872", issue_date="2026-11-08",
               base_amount=186.30, vat_rate=21, vat_amount=39.12, total_amount=225.42),
    "a2": dict(document_type="factura", category="compra_materiales", issuer_name="Materials i Àrids del Ter SL",
               issuer_tax_id=SUPPLIERS["sup-mat"].tax_id, recipient_tax_id=CLIENT_TAX, invoice_number="MAT-2026-0917", issue_date="2026-11-12",
               base_amount=1846.00, vat_rate=21, vat_amount=387.66, total_amount=2233.66),
    "a3": dict(document_type="factura_simplificada", category="combustible", issuer_name="Estació de Servei Gurb SL",
               issuer_tax_id=SUPPLIERS["sup-fuel"].tax_id, recipient_tax_id=CLIENT_TAX, invoice_number="T26-048213", issue_date="2026-11-14",
               base_amount=76.73, vat_rate=21, vat_amount=16.11, total_amount=92.84),
    "a4": dict(document_type="factura", category="telefonia", issuer_name="Telcom Plana SL",
               issuer_tax_id=SUPPLIERS["sup-tel"].tax_id, recipient_tax_id=CLIENT_TAX, invoice_number="TP/26/118734", issue_date="2026-11-05",
               base_amount=74.30, vat_rate=21, vat_amount=15.60, total_amount=89.90),
    "a5": dict(document_type="factura", category="compra_materiales", issuer_name="Materials i Àrids del Ter SL",
               issuer_tax_id=SUPPLIERS["sup-mat"].tax_id, recipient_tax_id=CLIENT_TAX, invoice_number="MAT-2026-0917", issue_date="2026-11-12",
               base_amount=1846.00, vat_rate=21, vat_amount=387.66, total_amount=2233.66),
}


@pytest.fixture
def settings(tmp_path):
    src = DATA_DIR / "kroomix.db"
    if not src.exists():
        pytest.skip("Faltan los datos de demo: uv run python -m app.seed.generate")
    dst = tmp_path / "test.db"
    shutil.copy(src, dst)
    return replace(Settings(), db_path=dst, data_dir=DATA_DIR, fault_injection={}, quotes_dir_override=tmp_path / "quotes")


@pytest.fixture
def db(settings):
    db = Database(settings.db_path)
    # Partimos de cero: sin ejecuciones previas copiadas.
    for t in ("runs", "run_events", "cases", "extractions", "duplicate_checks", "case_documents", "incidents",
              "review_tasks", "email_drafts", "draft_actions", "audit_log", "quote_lines", "renewal_reviews", "audit_reviews"):
        db.execute(f"DELETE FROM {t}")
    return db


class Harness:
    def __init__(self, db, settings, email_id=MAIN, run_id="run-test"):
        db.execute("INSERT INTO runs (id, email_id, status) VALUES (?,?,?)", (run_id, email_id, "en_curso"))
        self.bus = RunEventBus(db, run_id)
        self.ctx = RunContext(db=db, settings=settings, bus=self.bus, run_id=run_id, email_id=email_id)
        self.presenter = Presenter()

    def call(self, name, **args):
        return execute_tool(self.ctx, TOOLS_BY_NAME[name], args, self.presenter)

    def events(self, type_=None):
        rows = self.ctx.db.all("SELECT type, payload FROM run_events WHERE run_id=? ORDER BY seq", (self.ctx.run_id,))
        import json
        return [{"type": r["type"], **json.loads(r["payload"])} for r in rows if type_ in (None, r["type"])]


@pytest.fixture
def harness(db, settings):
    return Harness(db, settings)


def run_main_flow(h: Harness, register=True):
    """Secuencia que haría el agente en el escenario principal."""
    h.call("find_client", email_address="jordi@construccionsmartinez.example")
    h.call("open_case", client_id="cli-martinez")
    for k, data in MAIN_EXTRACTIONS.items():
        h.call("read_document", attachment_id=f"{MAIN}-{k}")
        h.call("submit_extraction", attachment_id=f"{MAIN}-{k}", **data)
    checks = {k: h.call("check_duplicates", attachment_id=f"{MAIN}-{k}").data for k in MAIN_EXTRACTIONS}
    recurring = h.call("get_recurring_patterns", client_id="cli-martinez").data
    if register:
        for k, data in MAIN_EXTRACTIONS.items():
            status = "duplicate" if checks[k]["is_duplicate"] else "valid"
            h.call("register_document", attachment_id=f"{MAIN}-{k}", status=status, category=data["category"])
    return checks, recurring


@pytest.fixture(scope="module")
def runner(tmp_path_factory):
    """Ejecuta el agente real sobre una copia de la BD (solo lo usan las evals: `-m eval`)."""
    from eval_support import make_runner
    return make_runner(tmp_path_factory)
