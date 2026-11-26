"""Cálculo y comprobaciones deterministas de renovaciones de pólizas.

Qué alertas tiene una póliza, cuántos días quedan y cuánto dinero está en juego lo decide este módulo, nunca el modelo.
Las constantes son la única fuente de las reglas (el texto de las reglas se genera a partir de ellas).
"""

from __future__ import annotations

from datetime import date
from decimal import ROUND_HALF_UP, Decimal

WINDOW_DAYS = 60            # se gestionan las pólizas que vencen en los próximos 60 días
URGENT_DAYS = 15            # por debajo de este plazo, la renovación es urgente
MAX_INCREASE_PCT = Decimal("10")   # una subida de prima superior a esto exige revisión
CLAIMS_THRESHOLD = 2        # siniestros en los últimos 12 meses a partir de los cuales hay que revisar
CENT = Decimal("0.01")

FLAG_TITLES = {
    "subida_prima": "Subida de prima",
    "cobertura_reducida": "Cobertura reducida",
    "siniestralidad": "Siniestralidad alta",
    "sin_oferta": "Sin oferta de renovación",
}


def money(x) -> Decimal:
    return Decimal(str(x)).quantize(CENT, rounding=ROUND_HALF_UP)


def days_left(renewal_date: str, today: str) -> int:
    return (date.fromisoformat(renewal_date) - date.fromisoformat(today)).days


def in_window(days: int) -> bool:
    return 0 <= days <= WINDOW_DAYS


def change_pct(current, offer) -> float | None:
    if offer is None or not current:
        return None
    return float(((money(offer) - money(current)) / money(current) * 100).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP))


def policy_flags(policy: dict) -> list[str]:
    """Alertas de una póliza a partir de sus datos: subida de prima, recorte de cobertura, siniestros o falta de oferta."""
    flags: list[str] = []
    offer = policy["renewal_premium"]
    # Se compara con el porcentaje exacto, no con el redondeado que se muestra.
    if offer is not None and policy["annual_premium"] and (money(offer) - money(policy["annual_premium"])) * 100 > MAX_INCREASE_PCT * money(policy["annual_premium"]):
        flags.append("subida_prima")
    if policy["coverage_reduced"]:
        flags.append("cobertura_reducida")
    if (policy["claims_12m"] or 0) >= CLAIMS_THRESHOLD:
        flags.append("siniestralidad")
    if policy["renewal_premium"] is None:
        flags.append("sin_oferta")
    return flags


def compute_renewals(items: list[dict]) -> dict:
    """Totales de una revisión. Cada ítem: annual_premium, renewal_premium (puede ser None), commission_pct, flags, days_left."""
    current = sum((money(i["annual_premium"]) for i in items), Decimal(0))
    at_risk = sum((money(i["annual_premium"]) for i in items if i["flags"]), Decimal(0))
    offered = sum((money(i["renewal_premium"] if i["renewal_premium"] is not None else i["annual_premium"]) for i in items), Decimal(0))
    commission = sum((money(i["renewal_premium"] if i["renewal_premium"] is not None else i["annual_premium"]) * Decimal(str(i["commission_pct"])) / 100
                      for i in items), Decimal(0))
    return {
        "policies": len(items), "premium_in_window": float(current), "premium_at_risk": float(at_risk),
        "at_risk_count": sum(1 for i in items if i["flags"]), "urgent_count": sum(1 for i in items if i["days_left"] <= URGENT_DAYS),
        "renewal_premium_total": float(offered),
        "internal": {"commission": float(money(commission))},
    }
