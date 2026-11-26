from app.seed.dataset import CLIENTS, SUPPLIERS
from app.validation.fiscal import validate_amounts, validate_issue_date, validate_tax_id
from app.validation.matching import duplicate_match, recurring_patterns


def test_generated_tax_ids_are_valid():
    for x in list(CLIENTS.values()) + list(SUPPLIERS.values()):
        assert validate_tax_id(x.tax_id)["valid"], x.tax_id


def test_tax_id_detects_wrong_control_and_formats():
    assert validate_tax_id("12345678Z")["valid"]
    assert not validate_tax_id("12345678A")["valid"]
    assert validate_tax_id("X1234567L")["valid"]
    good = SUPPLIERS["sup-mat"].tax_id
    bad = good[:-1] + str((int(good[-1]) + 1) % 10)
    assert not validate_tax_id(bad)["valid"]
    assert not validate_tax_id("hola")["valid"]
    assert validate_tax_id(f"ES-{good}")["normalized"] == good


def test_amounts_ok_with_withholding():
    assert validate_amounts(1250, 21, 262.50, 237.50, 1275.00) == []


def test_amounts_detect_mismatch():
    codes = {i["code"] for i in validate_amounts(100, 21, 21, 0, 125)}
    assert "total_mismatch" in codes
    codes = {i["code"] for i in validate_amounts(100, 21, 20, 0, 120)}
    assert "vat_mismatch" in codes
    assert {i["code"] for i in validate_amounts(None, None, None, 0, None)} == {"missing_total"}
    assert "vat_rate_invalid" in {i["code"] for i in validate_amounts(100, 18, 18, 0, 118)}


def test_issue_date_period():
    assert validate_issue_date("2026-11-08", "2026-11") == []
    assert validate_issue_date("2026-10-31", "2026-11")[0]["blocking"] is False
    assert validate_issue_date("31/10/2026", "2026-11")[0]["blocking"] is True


def test_duplicate_criteria():
    a = {"issuer_tax_id": "B66471202", "invoice_number": "MAT-2026-0917", "issue_date": "2026-11-12", "total_amount": 2233.66}
    assert duplicate_match(a, {**a, "invoice_number": "mat 2026/0917"}) == "mismo emisor y mismo número de factura"
    assert duplicate_match(a, {**a, "invoice_number": "X"}) == "mismo emisor, misma fecha y mismo importe"
    assert duplicate_match(a, {**a, "invoice_number": "X", "total_amount": 1}) is None
    assert duplicate_match(a, {**a, "issuer_tax_id": "A66120775"}) is None
    assert duplicate_match({"file_sha256": "h"}, {"file_sha256": "h"}) == "mismo fichero"


def test_recurring_only_monthly_suppliers():
    hist = []
    for m in ["05", "06", "07", "08", "09", "10"]:
        hist.append({"supplier_tax_id": "R", "supplier_name": "Alquiler", "category": "alquiler", "period": f"2026-{m}",
                     "issue_date": f"2026-{m}-01", "invoice_number": f"LL-{m}", "total_amount": 1275})
        hist.append({"supplier_tax_id": "E", "supplier_name": "Luz", "category": "suministro_electricidad", "period": f"2026-{m}",
                     "issue_date": f"2026-{m}-08", "invoice_number": f"FE-{m}", "total_amount": 200})
        for d in ("03", "13", "23"):  # gasolinera: varias al mes, no es un patrón mensual
            hist.append({"supplier_tax_id": "G", "supplier_name": "Gasolinera", "category": "combustible", "period": f"2026-{m}",
                         "issue_date": f"2026-{m}-{d}", "invoice_number": f"T{m}{d}", "total_amount": 80})
    hist.append({"supplier_tax_id": "Q", "supplier_name": "Seguro", "category": "seguros", "period": "2026-06",
                 "issue_date": "2026-06-10", "invoice_number": "P1", "total_amount": 600})
    patterns = recurring_patterns(hist, "2026-11", received=[{"issuer_tax_id": "E"}])
    assert {p["supplier_tax_id"] for p in patterns} == {"R", "E"}
    missing = [p for p in patterns if not p["received_this_period"]]
    assert [p["supplier_tax_id"] for p in missing] == ["R"]
