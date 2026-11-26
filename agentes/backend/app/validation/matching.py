"""Coincidencias exactas y patrones de recurrencia (deterministas)."""

from __future__ import annotations

from collections import defaultdict
from statistics import mean

from .fiscal import money, normalize_tax_id


def normalize_invoice_number(value: str | None) -> str:
    return "".join(ch for ch in (value or "").upper() if ch.isalnum())


def duplicate_match(candidate: dict, other: dict) -> str | None:
    """Devuelve el criterio por el que `candidate` duplica a `other`, o None.

    Criterios, de más a menos fuerte:
    - mismo fichero (hash),
    - mismo emisor + mismo número de factura,
    - mismo emisor + misma fecha + mismo total.
    """
    if candidate.get("file_sha256") and candidate.get("file_sha256") == other.get("file_sha256"):
        return "mismo fichero"
    same_issuer = normalize_tax_id(candidate.get("issuer_tax_id")) and (
        normalize_tax_id(candidate.get("issuer_tax_id")) == normalize_tax_id(other.get("issuer_tax_id"))
    )
    if not same_issuer:
        return None
    n1, n2 = normalize_invoice_number(candidate.get("invoice_number")), normalize_invoice_number(other.get("invoice_number"))
    if n1 and n1 == n2:
        return "mismo emisor y mismo número de factura"
    if (
        candidate.get("issue_date")
        and candidate.get("issue_date") == other.get("issue_date")
        and money(candidate.get("total_amount")) == money(other.get("total_amount"))
    ):
        return "mismo emisor, misma fecha y mismo importe"
    return None


def similar(candidate: dict, other: dict, tolerance: float = 0.15) -> bool:
    """Mismo emisor e importe dentro de ±tolerance. Sirve para contexto, no para decidir."""
    if normalize_tax_id(candidate.get("issuer_tax_id")) != normalize_tax_id(other.get("issuer_tax_id")):
        return False
    a, b = candidate.get("total_amount"), other.get("total_amount")
    if a is None or b is None or not b:
        return True
    return abs(float(a) - float(b)) / float(b) <= tolerance


def _months_back(period: str, n: int) -> list[str]:
    y, m = map(int, period.split("-"))
    out = []
    for _ in range(n):
        m -= 1
        if m == 0:
            y, m = y - 1, 12
        out.append(f"{y:04d}-{m:02d}")
    return out


def recurring_patterns(history: list[dict], period: str, received: list[dict], lookback: int = 6, min_months: int = 4) -> list[dict]:
    """Detecta proveedores con factura mensual recurrente y si ya llegó la del periodo.

    history: documentos históricos con supplier_tax_id, supplier_name, category, period, total_amount, issue_date.
    received: extracciones del periodo actual (issuer_tax_id).
    """
    window = set(_months_back(period, lookback))
    by_supplier: dict[str, list[dict]] = defaultdict(list)
    for doc in history:
        if doc["period"] in window:
            by_supplier[normalize_tax_id(doc["supplier_tax_id"])].append(doc)

    received_ids = {normalize_tax_id(r.get("issuer_tax_id")) for r in received if r.get("issuer_tax_id")}
    patterns = []
    for tax_id, docs in by_supplier.items():
        months = sorted({d["period"] for d in docs})
        if len(months) < min_months:
            continue
        # Mensual: como mucho una factura por mes de media.
        per_month = len(docs) / len(months)
        if per_month > 1.25:
            continue
        last = max(docs, key=lambda d: d["issue_date"])
        days = sorted(int(d["issue_date"][8:10]) for d in docs)
        patterns.append({
            "supplier_name": last["supplier_name"],
            "supplier_tax_id": tax_id,
            "category": last["category"],
            "months_seen": months,
            "months_seen_count": len(months),
            "lookback_months": lookback,
            "average_total": round(mean(float(d["total_amount"]) for d in docs), 2),
            "last_invoice_number": last["invoice_number"],
            "last_issue_date": last["issue_date"],
            "usual_issue_day": days[len(days) // 2],
            "received_this_period": tax_id in received_ids,
        })
    patterns.sort(key=lambda p: (p["received_this_period"], p["supplier_name"]))
    return patterns
