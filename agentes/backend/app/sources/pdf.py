"""PDF de un documento de apoyo (ficticio) para poder enseñarlo o imprimirlo."""

from __future__ import annotations

from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

INK, MUTED, RULE, SOFT = colors.HexColor("#1F2328"), colors.HexColor("#6B7280"), colors.HexColor("#D9DCE1"), colors.HexColor("#F4F5F7")


def render_source_pdf(doc: dict, firm_name: str) -> bytes:
    buf = BytesIO()
    d = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=18 * mm, bottomMargin=16 * mm, title=doc["title"])
    base = getSampleStyleSheet()["Normal"]
    small = ParagraphStyle("s", parent=base, fontName="Helvetica", fontSize=8.5, leading=11, textColor=MUTED)
    cell = ParagraphStyle("c", parent=base, fontName="Helvetica", fontSize=8.5, leading=11, textColor=INK)
    cellb = ParagraphStyle("cb", parent=cell, fontName="Helvetica-Bold")
    story = [Paragraph(escape(firm_name), small), Spacer(1, 3 * mm),
             Paragraph(escape(doc["title"]), ParagraphStyle("t", parent=base, fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=INK)),
             Paragraph(escape(doc["subtitle"]), ParagraphStyle("st", parent=small, fontSize=10, leading=13)), Spacer(1, 6 * mm)]
    W = A4[0] - 36 * mm
    for s in doc["sections"]:
        if s.get("heading"):
            story += [Paragraph(escape(s["heading"]), cellb), Spacer(1, 2 * mm)]
        if s.get("fields"):
            t = Table([[Paragraph(escape(k), small), Paragraph(escape(v), cell)] for k, v in s["fields"]], colWidths=[W * 0.32, W * 0.68])
            t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
            story += [t, Spacer(1, 4 * mm)]
        if s.get("table"):
            tb = s["table"]
            align = tb.get("align") or ["l"] * len(tb["columns"])
            def p(txt, bold=False, a="l"):
                st = ParagraphStyle("x", parent=cellb if bold else cell, alignment=2 if a == "r" else 0)
                return Paragraph(escape(str(txt)), st)
            rows = [[p(c, True, align[i]) for i, c in enumerate(tb["columns"])]] + [[p(v, False, align[i]) for i, v in enumerate(r)] for r in tb["rows"]]
            t = Table(rows, repeatRows=1)
            t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), SOFT), ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                                   ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
            story += [t, Spacer(1, 4 * mm)]
        if s.get("note"):
            story += [Paragraph(escape(s["note"]), small), Spacer(1, 3 * mm)]
    story += [Spacer(1, 6 * mm), Paragraph("Documento ficticio de demostración. Los datos no corresponden a personas ni empresas reales.", small)]
    d.build(story)
    return buf.getvalue()
