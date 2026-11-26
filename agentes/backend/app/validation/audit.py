"""Cruce determinista de facturas con pedidos y albaranes.

Qué anomalías tiene una factura y cuánto dinero afectan lo decide este módulo, nunca el modelo.
Importes en base imponible (sin IVA); el IVA se informa aparte.
"""

from __future__ import annotations

import re
from decimal import ROUND_HALF_UP, Decimal

IVA_RATE = Decimal("21")
CENT = Decimal("0.01")

KIND_TITLES = {
    "duplicada": "Factura duplicada",
    "sin_pedido": "Factura sin pedido",
    "concepto_no_pedido": "Concepto que no se pidió",
    "precio_distinto": "Precio superior al pedido",
    "cantidad_no_entregada": "Cantidad facturada y no entregada",
    "error_aritmetico": "Error de cálculo en la factura",
}


def money(x) -> Decimal:
    return Decimal(str(x)).quantize(CENT, rounding=ROUND_HALF_UP)


def norm_number(n: str) -> str:
    return re.sub(r"[^0-9a-z]", "", (n or "").casefold())


def lines_base(lines: list[dict]) -> Decimal:
    return sum((money(Decimal(str(l["quantity"])) * Decimal(str(l["unit_price"]))) for l in lines), Decimal(0))


def match_invoice(inv: dict, inv_lines: list[dict], order_lines: list[dict] | None, delivered: dict[str, float],
                  duplicate_of: str | None) -> list[dict]:
    """Anomalías de una factura. Cada una: {kind, item_code, description, amount, detail}."""
    base = money(inv["base"])
    if duplicate_of:
        return [{"kind": "duplicada", "item_code": "", "description": "Toda la factura", "amount": float(base),
                 "detail": f"Misma factura que {duplicate_of} (mismo proveedor y número). Pagarla otra vez duplicaría {float(base):.2f} €."}]
    if order_lines is None:
        return [{"kind": "sin_pedido", "item_code": "", "description": "Toda la factura", "amount": float(base),
                 "detail": "No hay ningún pedido que respalde esta factura."}]
    out: list[dict] = []
    ordered = {l["item_code"]: l for l in order_lines}
    for l in inv_lines:
        code, qty, price = l["item_code"], Decimal(str(l["quantity"])), Decimal(str(l["unit_price"]))
        o = ordered.get(code)
        if o is None:
            out.append({"kind": "concepto_no_pedido", "item_code": code, "description": l["description"], "amount": float(money(qty * price)),
                        "detail": f"«{l['description']}» no figura en el pedido."})
            continue
        if price > Decimal(str(o["unit_price"])):
            diff = money((price - Decimal(str(o["unit_price"]))) * qty)
            out.append({"kind": "precio_distinto", "item_code": code, "description": l["description"], "amount": float(diff),
                        "detail": f"{l['description']}: facturado a {float(price):.2f} € y pedido a {float(o['unit_price']):.2f} € ({float(qty):g} uds.)."})
        got = Decimal(str(delivered.get(code, 0)))
        if qty > got:
            short = money((qty - got) * price)
            out.append({"kind": "cantidad_no_entregada", "item_code": code, "description": l["description"], "amount": float(short),
                        "detail": f"{l['description']}: facturadas {float(qty):g} y entregadas {float(got):g}."})
    calc_base = lines_base(inv_lines)
    calc_vat = money(base * IVA_RATE / 100)
    if abs(calc_base - base) > CENT or abs(calc_vat - money(inv["vat"])) > CENT or abs(base + money(inv["vat"]) - money(inv["total"])) > CENT:
        out.append({"kind": "error_aritmetico", "item_code": "", "description": "Totales de la factura", "amount": float(max(base - calc_base, Decimal(0))),
                    "detail": f"Las líneas suman {float(calc_base):.2f} €, la base declarada es {float(base):.2f} €, el IVA {float(money(inv['vat'])):.2f} € y el total {float(money(inv['total'])):.2f} €."})
    return out


def compute_audit(items: list[dict]) -> dict:
    """Totales de una auditoría. Cada ítem: base, total, findings[{kind, amount}]."""
    at_risk = sum((money(f["amount"]) for i in items for f in i["findings"]), Decimal(0))
    vat = money(at_risk * IVA_RATE / 100)
    by_kind: dict[str, float] = {}
    for i in items:
        for f in i["findings"]:
            by_kind[f["kind"]] = float(money(by_kind.get(f["kind"], 0) + money(f["amount"])))
    return {
        "invoices": len(items), "invoiced_base": float(sum((money(i["base"]) for i in items), Decimal(0))),
        "with_findings": sum(1 for i in items if i["findings"]), "clean": sum(1 for i in items if not i["findings"]),
        "at_risk_base": float(at_risk), "at_risk_vat": float(vat), "at_risk_total": float(at_risk + vat), "by_kind": by_kind,
    }
