import re

from app.tools.base import ToolError
from conftest import MAIN, MAIN_EXTRACTIONS, Harness, run_main_flow


def test_identifies_client_by_email(harness):
    r = harness.call("find_client", email_address="Jordi@ConstruccionsMartinez.example").data
    assert r["status"] == "identified" and r["client"]["legal_name"] == "Construccions Martínez SL"


def test_unknown_client_is_not_guessed(harness):
    r = harness.call("find_client", email_address="admin@reformesbosch.example", company_name="Reformes Bosch").data
    assert r["status"] == "not_found" and r["candidates"] == []


def test_name_only_match_is_not_an_identification(harness):
    r = harness.call("find_client", company_name="Martínez").data
    assert r["status"] == "candidates"


def test_main_flow_detects_duplicate_and_missing_rent(harness):
    checks, recurring = run_main_flow(harness)
    dups = [k for k, c in checks.items() if c["is_duplicate"]]
    assert dups == ["a5"], "solo la foto (posterior) es el duplicado"
    assert checks["a2"]["copies_of_this_document"][0]["attachment_id"] == f"{MAIN}-a5"
    missing = recurring["expected_not_received"]
    assert [m["category"] for m in missing] == ["alquiler"]
    assert recurring["definitive"]


def test_totals_do_not_double_count_duplicate(harness):
    run_main_flow(harness)
    harness.call("prepare_email_draft", subject="Documentación de noviembre", body="Falta la factura del alquiler.")
    err = harness.call("finalize_case", summary="Resumen")
    assert isinstance(err, ToolError) and err.code == "missing_review_tasks"
    harness.call("create_review_task", title="Confirmar duplicado", reason="Foto de MAT-2026-0917")
    harness.call("create_review_task", title="Reclamar alquiler", reason="Falta la factura de noviembre")
    out = harness.call("finalize_case", summary="Resumen")
    assert not isinstance(out, ToolError)
    expected = sum(MAIN_EXTRACTIONS[k]["total_amount"] for k in ("a1", "a2", "a3", "a4"))
    assert abs(out.data["totals"]["total"] - expected) < 0.001
    assert out.data["valid_count"] == 4 and out.data["duplicate_count"] == 1


def test_duplicate_check_before_all_extractions_is_not_definitive(harness):
    harness.call("open_case", client_id="cli-martinez")
    harness.call("submit_extraction", attachment_id=f"{MAIN}-a5", **MAIN_EXTRACTIONS["a5"])
    r = harness.call("check_duplicates", attachment_id=f"{MAIN}-a5").data
    assert r["is_duplicate"] is False and r["complete"] is False
    err = harness.call("register_document", attachment_id=f"{MAIN}-a5", status="valid", category="compra_materiales")
    assert isinstance(err, ToolError) and err.code == "duplicates_not_checked"


def test_guardrails_on_register(harness):
    run_main_flow(harness, register=False)
    err = harness.call("register_document", attachment_id=f"{MAIN}-a5", status="valid", category="compra_materiales")
    assert isinstance(err, ToolError) and err.code == "is_duplicate"
    err = harness.call("register_document", attachment_id=f"{MAIN}-a1", status="duplicate", category="suministro_electricidad")
    assert isinstance(err, ToolError) and err.code == "not_duplicate"


def test_register_is_idempotent(harness):
    run_main_flow(harness)
    again = harness.call("register_document", attachment_id=f"{MAIN}-a1", status="valid", category="suministro_electricidad").data
    assert again["already_registered"]
    n = harness.ctx.db.one("SELECT count(*) AS n FROM case_documents WHERE case_id=?", (harness.ctx.case_id,))["n"]
    assert n == 5


def test_incidents_are_not_duplicated(harness):
    run_main_flow(harness)
    harness.call("check_duplicates", attachment_id=f"{MAIN}-a5")
    harness.call("get_recurring_patterns", client_id="cli-martinez")
    kinds = [r["kind"] for r in harness.ctx.db.all("SELECT kind FROM incidents WHERE case_id=?", (harness.ctx.case_id,))]
    assert sorted(kinds) == ["duplicado", "pendiente"]


def test_extraction_validation_flags_wrong_amounts(harness):
    harness.call("open_case", client_id="cli-martinez")
    bad = {**MAIN_EXTRACTIONS["a1"], "total_amount": 9999.0}
    r = harness.call("submit_extraction", attachment_id=f"{MAIN}-a1", **bad).data
    assert not r["valid"] and any(i["code"] == "total_mismatch" for i in r["issues"])


def test_extraction_attempts_are_limited(harness):
    harness.call("open_case", client_id="cli-martinez")
    bad = {**MAIN_EXTRACTIONS["a1"], "total_amount": 1.0}
    for _ in range(harness.ctx.settings.max_extraction_attempts):
        harness.call("submit_extraction", attachment_id=f"{MAIN}-a1", **bad)
    err = harness.call("submit_extraction", attachment_id=f"{MAIN}-a1", **bad)
    assert isinstance(err, ToolError) and err.code == "max_attempts"


def test_recipient_must_be_the_client(harness):
    harness.call("open_case", client_id="cli-martinez")
    r = harness.call("submit_extraction", attachment_id=f"{MAIN}-a1", **{**MAIN_EXTRACTIONS["a1"], "recipient_tax_id": "12345678Z"}).data
    assert any(i["code"] == "recipient_mismatch" for i in r["issues"])


def test_finalize_requires_every_document(harness):
    harness.call("open_case", client_id="cli-martinez")
    err = harness.call("finalize_case", summary="x")
    assert isinstance(err, ToolError) and err.code == "unregistered"


def test_draft_recipient_comes_from_client_record(harness):
    harness.call("open_case", client_id="cli-martinez")
    r = harness.call("prepare_email_draft", subject="s", body="b").data
    assert r["to"] == "jordi@construccionsmartinez.example" and r["sent"] is False


def test_unreadable_image_is_flagged(db, settings):
    h = Harness(db, settings, email_id="email-roca-nov")
    h.call("open_case", client_id="cli-roca")
    r = h.call("read_document", attachment_id="email-roca-nov-a2").data
    assert r["legibility"] == "baja"
    r = h.call("submit_extraction", attachment_id="email-roca-nov-a2", document_type="ilegible", category="otros",
               unreadable_fields=["todo"]).data
    assert not r["valid"]


def test_attachment_from_other_email_is_rejected(harness):
    harness.call("open_case", client_id="cli-martinez")
    err = harness.call("read_document", attachment_id="email-roca-nov-a1")
    assert isinstance(err, ToolError) and err.code == "unknown_attachment"


def test_invalid_input_is_reported_not_raised(harness):
    err = harness.call("register_document", attachment_id=f"{MAIN}-a1", status="aprobado", category="x")
    assert isinstance(err, ToolError) and err.code == "invalid_input"


def test_fault_injection_then_recovery(db, settings):
    from dataclasses import replace
    h = Harness(db, replace(settings, fault_injection={"get_document_history": 1}))
    first = h.call("get_document_history", client_id="cli-martinez")
    second = h.call("get_document_history", client_id="cli-martinez")
    assert isinstance(first, ToolError) and first.code == "transient"
    assert second.data["document_count"] > 0


def test_timeline_has_no_technical_terms(harness):
    run_main_flow(harness)
    tool_names = ["find_client", "open_case", "read_document", "submit_extraction", "check_duplicates", "register_document",
                  "get_recurring_patterns", "attachment_id", "case_id", "mcp__"]
    for ev in harness.events():
        if ev["type"] in ("activity_started", "activity_finished"):
            text = f"{ev.get('label', '')} {ev.get('detail') or ''}"
            assert not any(t in text for t in tool_names), text
            assert not re.search(r"[{}\[\]]", text), text


def test_tool_schemas_keep_fields_named_title():
    """Regresión: el esquema que ve el modelo no puede perder campos llamados «title» (rompía create_review_task)."""
    from app.agent.runners import inline_schema
    from app.tools.catalog import TOOLS
    for spec in TOOLS:
        schema = inline_schema(spec.input_model)
        assert set(schema.get("required", [])) <= set(schema["properties"]), spec.name
    review = next(t for t in TOOLS if t.name == "create_review_task")
    assert "title" in inline_schema(review.input_model)["properties"]
