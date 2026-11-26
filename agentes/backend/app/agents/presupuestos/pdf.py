"""Documento PDF del presupuesto para el cliente. No incluye margen ni costes internos."""

from __future__ import annotations

from datetime import date
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

INK, MUTED, RULE, SOFT, ACCENT = HexColor("#1F2328"), HexColor("#6B7280"), HexColor("#D9DCE1"), HexColor("#F4F5F7"), HexColor("#0A7CF0")
PLURAL = {"mes": "meses", "trimestre": "trimestres", "año": "años", "nómina": "nóminas", "servicio": "servicios", "declaración": "declaraciones"}


def eur(x: float) -> str:
    return f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " €"


def _qty(q: float) -> str:
    return str(int(q)) if float(q).is_integer() else f"{q:g}".replace(".", ",")


def _wrap(c: canvas.Canvas, text: str, font: str, size: float, width: float) -> list[str]:
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = f"{cur} {w}".strip()
        if c.stringWidth(trial, font, size) <= width:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    return lines + ([cur] if cur else [])


def render_quote_pdf(path: Path, quote: dict, firm: dict | None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=A4)
    W, H = A4
    left, right = 20 * mm, W - 20 * mm
    firm = firm or {"name": "Gestoría", "tax_id": "", "address": "", "city": "", "email": ""}

    c.setFillColor(INK); c.rect(left, H - 31 * mm, 9 * mm, 9 * mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 14); c.drawString(left + 2.6 * mm, H - 28.2 * mm, "K")
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 15); c.drawString(left + 12 * mm, H - 28 * mm, firm["name"])
    c.setFont("Helvetica", 8.5); c.setFillColor(MUTED)
    c.drawString(left + 12 * mm, H - 33 * mm, f"{firm.get('tax_id', '')} · {firm.get('city', '')} · {firm.get('email', '')}")
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 22); c.drawRightString(right, H - 28 * mm, "Presupuesto")
    c.setFont("Helvetica", 9); c.setFillColor(MUTED)
    c.drawRightString(right, H - 34 * mm, f"Nº {quote['quote_id']}")
    c.drawRightString(right, H - 38.5 * mm, f"Válido hasta el {date.fromisoformat(quote['valid_until']).strftime('%d/%m/%Y')}")

    y = H - 52 * mm
    c.setFillColor(MUTED); c.setFont("Helvetica-Bold", 8); c.drawString(left, y, "PARA")
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 11)
    cl = quote.get("client")
    name = cl["legal_name"] if cl else quote["requester"]["name"]
    c.drawString(left, y - 5.5 * mm, name)
    c.setFont("Helvetica", 9); c.setFillColor(MUTED)
    c.drawString(left, y - 10.5 * mm, (f"NIF {cl['tax_id']} · {cl['city']}" if cl else quote["requester"]["email"]))

    y -= 24 * mm
    cols = [left, left + 92 * mm, left + 112 * mm, left + 140 * mm, right]
    c.setFillColor(SOFT); c.rect(left, y - 2 * mm, right - left, 8 * mm, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica-Bold", 8)
    c.drawString(cols[0] + 2 * mm, y + 0.8 * mm, "CONCEPTO"); c.drawRightString(cols[2], y + 0.8 * mm, "CANT.")
    c.drawRightString(cols[3], y + 0.8 * mm, "PRECIO"); c.drawRightString(cols[4] - 2 * mm, y + 0.8 * mm, "IMPORTE")
    y -= 8 * mm
    for ln in quote["lines"]:
        c.setFillColor(INK); c.setFont("Helvetica", 9.5)
        rows = _wrap(c, ln["name"], "Helvetica", 9.5, 86 * mm)
        for i, row in enumerate(rows):
            c.drawString(cols[0] + 2 * mm, y - i * 4.4 * mm, row)
        c.drawRightString(cols[2], y, f"{_qty(ln['quantity'])} {ln['unit'] if float(ln['quantity']) == 1 else PLURAL.get(ln['unit'], ln['unit'])}")
        c.drawRightString(cols[3], y, eur(ln["unit_price"])); c.drawRightString(cols[4] - 2 * mm, y, eur(ln["subtotal"]))
        y -= max(1, len(rows)) * 4.4 * mm + 1.8 * mm
        c.setStrokeColor(RULE); c.setLineWidth(0.4); c.line(left, y + 3 * mm, right, y + 3 * mm)

    t = quote["totals"]
    y -= 4 * mm
    def total_row(label: str, value: str, bold: bool = False, color=INK) -> None:
        nonlocal y
        c.setFillColor(color); c.setFont("Helvetica-Bold" if bold else "Helvetica", 11 if bold else 9.5)
        c.drawString(cols[2] - 18 * mm, y, label); c.drawRightString(cols[4] - 2 * mm, y, value); y -= 6 * mm
    total_row("Subtotal", eur(t["subtotal"]))
    if t["discount"]:
        total_row(f"Descuento por volumen ({t['discount_pct']:g}%)", "−" + eur(t["discount"]), color=HexColor("#0E7A4B"))
    total_row("Base imponible", eur(t["base"]))
    total_row(f"IVA ({t['vat_rate']:g}%)", eur(t["vat"]))
    c.setStrokeColor(INK); c.setLineWidth(0.8); c.line(cols[2] - 18 * mm, y + 4 * mm, right, y + 4 * mm)
    y -= 1 * mm
    total_row("TOTAL", eur(t["total"]), bold=True, color=ACCENT)

    y -= 6 * mm
    c.setFillColor(MUTED); c.setFont("Helvetica", 8)
    note = ("Los servicios recurrentes se facturan según la unidad indicada (mensual, trimestral o anual). Presupuesto sujeto a la información "
            "facilitada por el cliente; cualquier servicio no incluido se presupuestará aparte.")
    for row in _wrap(c, note, "Helvetica", 8, right - left):
        c.drawString(left, y, row); y -= 4 * mm
    c.setFont("Helvetica", 7.5); c.drawString(left, 15 * mm, f"{firm['name']} · Presupuesto {quote['quote_id']} · Documento generado automáticamente y pendiente de revisión por la gestoría.")
    c.showPage(); c.save()
