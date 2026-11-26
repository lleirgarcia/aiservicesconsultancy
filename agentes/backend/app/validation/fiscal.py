"""Validaciones deterministas: identificadores fiscales e importes.

Nada de esto pasa por el modelo: son reglas exactas y verificables.
"""

from __future__ import annotations

import re
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

NIF_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE"
CIF_CONTROL_LETTERS = "JABCDEFGHI"
VALID_VAT_RATES = (0.0, 4.0, 10.0, 21.0)
AMOUNT_TOLERANCE = Decimal("0.02")


def normalize_tax_id(value: str | None) -> str:
    return re.sub(r"[\s\-.]", "", (value or "")).upper().removeprefix("ES")


def _cif_control_digit(body7: str) -> int:
    even = sum(int(d) for d in body7[1::2])
    odd = 0
    for d in body7[0::2]:
        doubled = int(d) * 2
        odd += doubled // 10 + doubled % 10
    return (10 - (even + odd) % 10) % 10


def cif_with_control(letter: str, body7: str) -> str:
    """Genera un CIF válido a partir de la letra y 7 dígitos (lo usa seed/)."""
    c = _cif_control_digit(body7)
    control = CIF_CONTROL_LETTERS[c] if letter in "KPQSNW" else str(c)
    return f"{letter}{body7}{control}"


def validate_tax_id(value: str | None) -> dict:
    """Valida NIF, NIE o CIF español. Devuelve {valid, kind, normalized, reason}."""
    v = normalize_tax_id(value)
    if not v:
        return {"valid": False, "kind": None, "normalized": v, "reason": "vacío"}
    if re.fullmatch(r"\d{8}[A-Z]", v):
        ok = NIF_LETTERS[int(v[:8]) % 23] == v[8]
        return {"valid": ok, "kind": "NIF", "normalized": v, "reason": None if ok else "letra de control incorrecta"}
    if re.fullmatch(r"[XYZ]\d{7}[A-Z]", v):
        num = int(str("XYZ".index(v[0])) + v[1:8])
        ok = NIF_LETTERS[num % 23] == v[8]
        return {"valid": ok, "kind": "NIE", "normalized": v, "reason": None if ok else "letra de control incorrecta"}
    if re.fullmatch(r"[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]", v):
        c = _cif_control_digit(v[1:8])
        letter, control = v[0], v[8]
        if letter in "KPQSNW":
            ok = control == CIF_CONTROL_LETTERS[c]
        elif letter in "ABEH":
            ok = control == str(c)
        else:
            ok = control in (str(c), CIF_CONTROL_LETTERS[c])
        return {"valid": ok, "kind": "CIF", "normalized": v, "reason": None if ok else "dígito de control incorrecto"}
    return {"valid": False, "kind": None, "normalized": v, "reason": "formato no reconocido"}


def money(x: float | int | str | None) -> Decimal | None:
    if x is None:
        return None
    return Decimal(str(x)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def validate_amounts(
    base: float | None,
    vat_rate: float | None,
    vat_amount: float | None,
    withholding: float | None,
    total: float | None,
) -> list[dict]:
    """Comprueba que base, IVA, retención y total cuadran. Devuelve incidencias."""
    issues: list[dict] = []
    b, va, w, t = money(base), money(vat_amount), money(withholding) or Decimal("0"), money(total)
    if t is None:
        issues.append({"code": "missing_total", "blocking": True, "message": "No consta el importe total."})
        return issues
    if b is None or va is None:
        issues.append({"code": "missing_breakdown", "blocking": True, "message": "Falta la base imponible o la cuota de IVA."})
        return issues
    if vat_rate is not None and float(vat_rate) not in VALID_VAT_RATES:
        issues.append({"code": "vat_rate_invalid", "blocking": True, "message": f"Tipo de IVA {vat_rate}% no válido en España."})
    if vat_rate is not None:
        expected_vat = money(b * Decimal(str(vat_rate)) / 100)
        if abs(expected_vat - va) > AMOUNT_TOLERANCE:
            issues.append({
                "code": "vat_mismatch", "blocking": True,
                "message": f"La cuota de IVA ({va} €) no corresponde al {vat_rate}% de la base ({expected_vat} €).",
            })
    expected_total = b + va - w
    if abs(expected_total - t) > AMOUNT_TOLERANCE:
        issues.append({
            "code": "total_mismatch", "blocking": True,
            "message": f"Base + IVA − retención = {expected_total} €, pero el total indicado es {t} €.",
        })
    if t <= 0:
        issues.append({"code": "non_positive_total", "blocking": True, "message": "El total no es positivo."})
    return issues


def validate_issue_date(issue_date: str | None, period: str) -> list[dict]:
    """period = 'YYYY-MM'. Una factura fuera del periodo no bloquea, pero se avisa."""
    if not issue_date:
        return [{"code": "missing_date", "blocking": True, "message": "No consta la fecha de emisión."}]
    try:
        d = date.fromisoformat(issue_date)
    except ValueError:
        return [{"code": "bad_date", "blocking": True, "message": f"Fecha no válida: {issue_date}."}]
    if d.strftime("%Y-%m") != period:
        return [{"code": "out_of_period", "blocking": False, "message": f"La fecha {issue_date} no pertenece al periodo {period}."}]
    return []
