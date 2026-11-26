"""Facturas PDF realistas con reportlab."""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from .dataset import Client, Supplier

INK = HexColor("#1F2328")
MUTED = HexColor("#6B7280")
RULE = HexColor("#D9DCE1")
SOFT = HexColor("#F4F5F7")


def eur(x: float) -> str:
    s = f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{s} €"


def fdate(iso: str) -> str:
    d = date.fromisoformat(iso)
    return d.strftime("%d/%m/%Y")


def _mark(c: canvas.Canvas, kind: str, x: float, y: float, s: float, color) -> None:
    c.setFillColor(color)
    c.setStrokeColor(color)
    if kind == "bolt":
        p = c.beginPath(); p.moveTo(x + s * .55, y + s); p.lineTo(x + s * .15, y + s * .45); p.lineTo(x + s * .45, y + s * .45)
        p.lineTo(x + s * .35, y); p.lineTo(x + s * .85, y + s * .6); p.lineTo(x + s * .55, y + s * .6); p.close(); c.drawPath(p, fill=1, stroke=0)
    elif kind == "wave":
        c.setLineWidth(2.2)
        for i in range(3):
            c.arc(x + i * s * .18, y + i * s * .18, x + s - i * s * .18, y + s - i * s * .18, 20, 140)
    elif kind == "house":
        p = c.beginPath(); p.moveTo(x, y + s * .55); p.lineTo(x + s / 2, y + s); p.lineTo(x + s, y + s * .55); p.close(); c.drawPath(p, fill=1, stroke=0)
        c.rect(x + s * .15, y, s * .7, s * .55, fill=1, stroke=0)
        c.setFillColor(white); c.rect(x + s * .42, y, s * .16, s * .3, fill=1, stroke=0)
    elif kind == "blocks":
        c.rect(x, y, s * .45, s * .45, fill=1, stroke=0); c.rect(x + s * .55, y, s * .45, s * .45, fill=1, stroke=0)
        c.rect(x + s * .27, y + s * .55, s * .45, s * .45, fill=1, stroke=0)
    elif kind == "drop":
        p = c.beginPath(); p.moveTo(x + s / 2, y + s); p.curveTo(x + s * .1, y + s * .5, x, y, x + s / 2, y)
        p.curveTo(x + s, y, x + s * .9, y + s * .5, x + s / 2, y + s); c.drawPath(p, fill=1, stroke=0)
    elif kind == "gear":
        c.circle(x + s / 2, y + s / 2, s * .42, fill=1, stroke=0); c.setFillColor(white); c.circle(x + s / 2, y + s / 2, s * .16, fill=1, stroke=0)
    elif kind == "shield":
        p = c.beginPath(); p.moveTo(x + s / 2, y); p.curveTo(x, y + s * .3, x, y + s * .7, x, y + s * .85)
        p.lineTo(x + s / 2, y + s); p.lineTo(x + s, y + s * .85); p.curveTo(x + s, y + s * .7, x + s, y + s * .3, x + s / 2, y); c.drawPath(p, fill=1, stroke=0)
    elif kind == "leaf":
        c.ellipse(x, y + s * .2, x + s, y + s * .8, fill=1, stroke=0)
    else:
        c.rect(x + s * .38, y, s * .24, s, fill=1, stroke=0); c.rect(x, y + s * .38, s, s * .24, fill=1, stroke=0)


def invoice_lines(inv: dict, sup: Supplier) -> list[tuple[str, str, str, str]]:
    """(concepto, cantidad, precio, importe). La suma de importes = base."""
    base = inv["base_amount"]
    cat = sup.category
    if cat == "suministro_electricidad":
        kwh = round(base / 0.1985)
        potencia = round(base * 0.22, 2)
        energia = round(base - potencia - 4.12, 2)
        return [
            ("Término de potencia · P1 15,0 kW · 31 días", "1", eur(potencia), eur(potencia)),
            (f"Término de energía · {kwh} kWh", f"{kwh}", "0,1498 €/kWh", eur(energia)),
            ("Alquiler de equipos de medida", "1", "4,12 €", "4,12 €"),
        ]
    if cat == "telefonia":
        return [
            ("Tarifa Empresa Fibra 1 Gb + 3 líneas móviles", "1", eur(base - 9.92), eur(base - 9.92)),
            ("Servicio centralita virtual", "1", "9,92 €", "9,92 €"),
        ]
    if cat == "alquiler":
        return [(f"Alquiler nave industrial C/ Gurb 45 · mes {fdate(inv['issue_date'])[3:]}", "1", eur(base), eur(base))]
    if cat == "compra_materiales" and sup.id == "sup-mat":
        items = [("Ciment Portland CEM II 42,5 R · saco 25 kg", 0.24, 7.85), ("Sorra de riu rentada 0/4 · tn", 0.31, 24.60),
                 ("Grava 6/12 · tn", 0.17, 22.40), ("Totxo calat 29x14x10 · palet", 0.28, 186.00)]
        out, acc = [], 0.0
        for i, (desc, share, price) in enumerate(items):
            if i == len(items) - 1:
                amount = round(base - acc, 2)
            else:
                qty = max(1, round(base * share / price))
                amount = round(qty * price, 2)
                acc += amount
                out.append((desc, str(qty), eur(price), eur(amount)))
                continue
            out.append((desc, "1", eur(amount), eur(amount)))
        return out
    if cat == "alquiler_maquinaria":
        return [("Alquiler miniexcavadora 1,8 tn · 3 jornadas", "3", eur(round(base / 3, 2)), eur(base))]
    if cat == "seguros":
        return [("Póliza multirriesgo empresa · prima trimestral (exenta de IVA)", "1", eur(base), eur(base))]
    if cat == "combustible":
        litros = round(inv["total_amount"] / 1.489, 2)
        return [(f"Gasoil A · {litros:.2f} L".replace(".", ","), f"{litros:.2f}".replace(".", ","), "1,489 €/L (IVA incl.)", eur(base))]
    return [("Suministro según albarán", "1", eur(base), eur(base))]


def render_invoice(path: Path, inv: dict, sup: Supplier, client: Client, *, extra_note: str | None = None,
                   consumption: list[tuple[str, int]] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(f"Factura {inv['invoice_number']}")
    c.setAuthor(sup.name)
    W, H = A4
    color = HexColor(sup.style.get("color", "#111827"))
    m = 18 * mm

    # Cabecera del emisor
    _mark(c, sup.style.get("mark", "plus"), m, H - m - 12 * mm, 12 * mm, color)
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 13)
    c.drawString(m + 16 * mm, H - m - 4.5 * mm, sup.name)
    c.setFont("Helvetica", 8.2); c.setFillColor(MUTED)
    c.drawString(m + 16 * mm, H - m - 9 * mm, f"{sup.address}  ·  CIF {sup.tax_id}")
    c.drawString(m + 16 * mm, H - m - 13 * mm, "administracio@" + sup.name.split()[0].lower().replace("'", "") + ".example")

    title = "FACTURA" if sup.category != "seguros" else "RECIBO DE PRIMA"
    c.setFillColor(color); c.setFont("Helvetica-Bold", 20)
    c.drawRightString(W - m, H - m - 6 * mm, title)
    c.setFont("Helvetica", 8.5); c.setFillColor(INK)
    due = (date.fromisoformat(inv["issue_date"]) + timedelta(days=30)).isoformat()
    meta = [("Nº factura", inv["invoice_number"]), ("Fecha de emisión", fdate(inv["issue_date"])), ("Vencimiento", fdate(due))]
    for i, (k, v) in enumerate(meta):
        y = H - m - 13 * mm - i * 4.6 * mm
        c.setFillColor(MUTED); c.drawRightString(W - m - 34 * mm, y, k)
        c.setFillColor(INK); c.setFont("Helvetica-Bold", 8.5); c.drawRightString(W - m, y, v); c.setFont("Helvetica", 8.5)

    c.setStrokeColor(color); c.setLineWidth(1.4)
    c.line(m, H - m - 30 * mm, W - m, H - m - 30 * mm)

    # Cliente
    top = H - m - 38 * mm
    c.setFillColor(SOFT); c.roundRect(m, top - 25 * mm, 88 * mm, 27 * mm, 2 * mm, fill=1, stroke=0)
    c.setFillColor(MUTED); c.setFont("Helvetica", 7.5); c.drawString(m + 4 * mm, top - 3 * mm, "FACTURAR A")
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 10); c.drawString(m + 4 * mm, top - 8.5 * mm, client.legal_name)
    c.setFont("Helvetica", 8.5)
    c.drawString(m + 4 * mm, top - 13.5 * mm, client.address)
    c.drawString(m + 4 * mm, top - 18 * mm, f"NIF/CIF: {client.tax_id}")

    if sup.category == "suministro_electricidad":
        d = date.fromisoformat(inv["issue_date"])
        prev_end = d.replace(day=1) - timedelta(days=1)
        c.setFillColor(MUTED); c.setFont("Helvetica", 7.5)
        c.drawString(m + 96 * mm, top - 3 * mm, "DATOS DEL SUMINISTRO")
        c.setFillColor(INK); c.setFont("Helvetica", 8.5)
        c.drawString(m + 96 * mm, top - 8.5 * mm, "CUPS: ES0031 4085 2211 0032 7HF")
        c.drawString(m + 96 * mm, top - 13.5 * mm, f"Periodo: 01/{prev_end:%m/%Y} – {prev_end:%d/%m/%Y}")
        c.drawString(m + 96 * mm, top - 18 * mm, "Tarifa 3.0TD · Potencia contratada 15 kW")
    elif sup.category == "telefonia":
        c.setFillColor(MUTED); c.setFont("Helvetica", 7.5)
        c.drawString(m + 96 * mm, top - 3 * mm, "CUENTA CLIENTE")
        c.setFillColor(INK); c.setFont("Helvetica", 8.5)
        c.drawString(m + 96 * mm, top - 8.5 * mm, "Nº cliente: 7700-21843")
        c.drawString(m + 96 * mm, top - 13.5 * mm, "Líneas: 938 85 xx xx · 3 móviles")

    # Líneas
    y = top - 36 * mm
    c.setFillColor(INK); c.setFont("Helvetica-Bold", 8)
    cols = [m, W - m - 70 * mm, W - m - 40 * mm, W - m]
    c.drawString(cols[0], y, "CONCEPTO"); c.drawRightString(cols[1] + 10 * mm, y, "CANT.")
    c.drawRightString(cols[2] + 8 * mm, y, "PRECIO"); c.drawRightString(cols[3], y, "IMPORTE")
    c.setStrokeColor(RULE); c.setLineWidth(.6); c.line(m, y - 2.5 * mm, W - m, y - 2.5 * mm)
    c.setFont("Helvetica", 8.6)
    for desc, qty, price, amount in invoice_lines(inv, sup):
        y -= 8 * mm
        c.drawString(cols[0], y, desc); c.drawRightString(cols[1] + 10 * mm, y, qty)
        c.drawRightString(cols[2] + 8 * mm, y, price); c.drawRightString(cols[3], y, amount)
        c.line(m, y - 3 * mm, W - m, y - 3 * mm)

    # Consumo (electricidad)
    if consumption:
        gy = y - 48 * mm
        c.setFillColor(MUTED); c.setFont("Helvetica", 7.5); c.drawString(m, gy + 34 * mm, "EVOLUCIÓN DEL CONSUMO (kWh)")
        mx = max(v for _, v in consumption)
        for i, (label, v) in enumerate(consumption):
            h = 26 * mm * v / mx
            c.setFillColor(color if i == len(consumption) - 1 else HexColor("#CBD5E1"))
            c.rect(m + i * 12 * mm, gy + 4 * mm, 8 * mm, h, fill=1, stroke=0)
            c.setFillColor(MUTED); c.setFont("Helvetica", 6.5); c.drawCentredString(m + i * 12 * mm + 4 * mm, gy, label)

    # Totales
    ty = 92 * mm
    rows = [("Base imponible", eur(inv["base_amount"]))]
    if inv["vat_rate"]:
        rows.append((f"IVA {inv['vat_rate']:.0f}%", eur(inv["vat_amount"])))
    else:
        rows.append(("IVA (operación exenta)", eur(0)))
    if inv.get("withholding_amount"):
        rows.append((f"Retención IRPF {inv['withholding_rate']:.0f}%", "-" + eur(inv["withholding_amount"])))
    c.setFont("Helvetica", 9)
    for i, (k, v) in enumerate(rows):
        yy = ty - i * 6 * mm
        c.setFillColor(MUTED); c.drawRightString(W - m - 38 * mm, yy, k)
        c.setFillColor(INK); c.drawRightString(W - m, yy, v)
    yy = ty - len(rows) * 6 * mm - 4 * mm
    c.setFillColor(color); c.roundRect(W - m - 82 * mm, yy - 4 * mm, 82 * mm, 11 * mm, 1.5 * mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 11)
    c.drawString(W - m - 78 * mm, yy, "TOTAL A PAGAR"); c.drawRightString(W - m - 4 * mm, yy, eur(inv["total_amount"]))

    # Pago y notas
    c.setFillColor(MUTED); c.setFont("Helvetica", 7.5)
    c.drawString(m, 52 * mm, "FORMA DE PAGO")
    c.setFillColor(INK); c.setFont("Helvetica", 8.5)
    c.drawString(m, 47.5 * mm, f"Domiciliación bancaria · {sup.iban}" if sup.iban else "Pagado con tarjeta")
    if extra_note:
        c.setFillColor(INK); c.setFont("Helvetica", 8)
        text = c.beginText(m, 38 * mm)
        for line in extra_note.split("\n"):
            text.textLine(line)
        c.drawText(text)

    c.setStrokeColor(RULE); c.line(m, 18 * mm, W - m, 18 * mm)
    c.setFillColor(MUTED); c.setFont("Helvetica", 6.8)
    c.drawString(m, 13.5 * mm, f"{sup.name} · Inscrita en el Registro Mercantil de Barcelona · CIF {sup.tax_id}")
    c.drawRightString(W - m, 13.5 * mm, "Página 1 de 1")
    c.showPage()
    c.save()
