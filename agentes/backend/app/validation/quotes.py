"""Cálculo y comprobaciones deterministas de presupuestos.

Ningún importe lo decide el modelo: los precios salen del tarifario y los totales los calcula este módulo.
Las constantes son la única fuente de las reglas internas (el texto de las reglas se genera a partir de ellas).
"""

from __future__ import annotations

import unicodedata
from decimal import ROUND_HALF_UP, Decimal

IVA_RATE = Decimal("21")
RECURRING_DISCOUNT_PCT = Decimal("5")
MIN_FAMILIES_FOR_DISCOUNT = 3  # servicios recurrentes distintos
MIN_MARGIN_PCT = Decimal("35")
HOURLY_COST = Decimal("22")  # coste interno por hora de trabajo de la gestoría
VALID_DAYS = 30
CENT = Decimal("0.01")


def money(x) -> Decimal:
    return Decimal(str(x)).quantize(CENT, rounding=ROUND_HALF_UP)


def normalize(text: str) -> str:
    """Minúsculas, sin tildes y con espacios simples: para comparar textos sin falsos negativos."""
    t = unicodedata.normalize("NFKD", text or "")
    t = "".join(ch for ch in t if not unicodedata.combining(ch))
    return " ".join(t.casefold().split())


def source_in_request(source: str, subject: str, body: str) -> bool:
    """¿El fragmento citado aparece literalmente (salvo mayúsculas, tildes y espacios) en la solicitud?"""
    s = normalize(source)
    return len(s) >= 4 and (s in normalize(body) or s in normalize(subject))


def line_subtotal(unit_price, quantity) -> Decimal:
    return money(Decimal(str(unit_price)) * Decimal(str(quantity)))


def compute_quote(lines: list[dict]) -> dict:
    """Totales de un presupuesto. Cada línea: kind ('recurrente'|'puntual'), family, subtotal, est_hours (por unidad), quantity."""
    recurring = sum((money(l["subtotal"]) for l in lines if l["kind"] == "recurrente"), Decimal(0))
    one_off = sum((money(l["subtotal"]) for l in lines if l["kind"] == "puntual"), Decimal(0))
    families = {l["family"] for l in lines if l["kind"] == "recurrente"}
    discount = money(recurring * RECURRING_DISCOUNT_PCT / 100) if len(families) >= MIN_FAMILIES_FOR_DISCOUNT else Decimal(0)
    subtotal = recurring + one_off
    base = subtotal - discount
    vat = money(base * IVA_RATE / 100)
    hours = sum((Decimal(str(l["est_hours"])) * Decimal(str(l["quantity"])) for l in lines), Decimal(0))
    cost = money(hours * HOURLY_COST)
    margin_pct = ((base - cost) / base * 100).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP) if base > 0 else Decimal(0)
    return {
        "recurring_subtotal": float(recurring), "one_off_subtotal": float(one_off), "subtotal": float(subtotal),
        "discount": float(discount), "discount_pct": float(RECURRING_DISCOUNT_PCT) if discount else 0.0,
        "base": float(base), "vat_rate": float(IVA_RATE), "vat": float(vat), "total": float(base + vat),
        "internal": {"hours": float(hours), "cost": float(cost), "margin": float(base - cost), "margin_pct": float(margin_pct),
                     "min_margin_pct": float(MIN_MARGIN_PCT), "below_min": bool(base > 0 and margin_pct < MIN_MARGIN_PCT)},
    }


def tier_for(volume: int, tiers: list[dict]) -> dict | None:
    return next((t for t in tiers if t["tier_min"] <= volume <= t["tier_max"]), None)
