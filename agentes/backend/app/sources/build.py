"""Documentos de apoyo de cada agente: la información que consulta además de la petición.

Se generan al vuelo a partir de los datos de la demo (clientes, cartera, tarifario, pedidos…), de modo que lo que se enseña
es exactamente lo que el agente consulta. Todo es ficticio. Nada de lo confidencial (márgenes, comisiones, costes) se incluye.
"""

from __future__ import annotations

from app.events.presenter import eur
from app.persistence.db import Database
from app.validation import renewals as rv

Doc = dict


def _num(x) -> str:
    return f"{x:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _date(iso: str | None) -> str:
    if not iso:
        return "—"
    y, m, d = iso.split("-")
    return f"{d}/{m}/{y}"


def client_for_email(db: Database, email: dict) -> dict | None:
    body = email["body"]
    for c in db.all("SELECT * FROM clients"):
        if c["tax_id"] in body or c["contact_email"].lower() == email["from_address"].lower() or c["email_domain"] == email["from_address"].split("@")[-1]:
            return c
    return None


def _doc(id_: str, title: str, subtitle: str, group: str, sections: list[dict]) -> Doc:
    return {"id": id_, "title": title, "subtitle": subtitle, "group": group, "sections": sections}


def _client_doc(c: dict) -> Doc:
    fields = [["Razón social", c["legal_name"]], ["NIF", c["tax_id"]], ["Dirección", c["address"]], ["Persona de contacto", c["contact_name"]],
              ["Correo", c["contact_email"]], ["Actividad", c["sector"]], ["Régimen de IVA", f"{c['vat_regime']} · {c['vat_period'].lower()}"],
              ["Impuesto de sociedades", c["irpf_regime"]], ["Cliente desde", _date(c["since"])]]
    return _doc("cliente", "Ficha del cliente", c["legal_name"], "Cliente", [{"fields": fields}])


def _rules_doc(db: Database, table: str, id_: str, title: str, subtitle: str) -> Doc:
    rows = db.all(f"SELECT code, title, body FROM {table} ORDER BY code")
    return _doc(id_, title, subtitle, "Criterios internos", [{"table": {"columns": ["Código", "Criterio", "Qué dice"], "rows": [[r["code"], r["title"], r["body"]] for r in rows]}}])


# -- gestión documental -------------------------------------------------------------------
def _documental(db: Database, email: dict) -> list[Doc]:
    c = client_for_email(db, email)
    docs: list[Doc] = []
    if c:
        docs.append(_client_doc(c))
        rows = db.all("SELECT s.name, s.category, count(*) AS n, round(avg(h.total_amount),2) AS avg_total, max(h.period) AS last "
                      "FROM historical_documents h JOIN suppliers s ON s.id=h.supplier_id WHERE h.client_id=? GROUP BY s.id ORDER BY n DESC, s.name", (c["id"],))
        docs.append(_doc("historico", "Histórico de documentación", "Últimos 6 meses de facturas ya contabilizadas", "Cliente", [{
            "table": {"columns": ["Proveedor", "Facturas", "Importe medio", "Última"], "align": ["l", "r", "r", "r"],
                      "rows": [[r["name"], str(r["n"]), eur(r["avg_total"]), r["last"]] for r in rows]},
            "note": "Con este histórico el agente detecta duplicados y facturas recurrentes que faltan."}]))
    docs.append(_rules_doc(db, "firm_rules", "reglas", "Procedimientos internos de la gestoría", "Cómo se trabaja cada expediente"))
    return docs


# -- presupuestos ---------------------------------------------------------------------------
def _presupuestos(db: Database, email: dict) -> list[Doc]:
    c = client_for_email(db, email)
    docs: list[Doc] = []
    if c:
        docs.append(_client_doc(c))
    else:
        docs.append(_doc("cliente", "Ficha del cliente", "No figura en la base de clientes", "Cliente", [{"note": "El remitente no es cliente registrado: el agente lo tratará como posible cliente nuevo."}]))
    rows = db.all("SELECT family, name, kind, unit, unit_price, tier_label, tier_min, tier_max FROM service_catalog ORDER BY family, unit_price")
    docs.append(_doc("tarifario", "Tarifario de servicios", "Precios de la gestoría (sin IVA)", "Tarifas y condiciones", [{
        "table": {"columns": ["Servicio", "Tipo", "Precio", "Unidad"], "align": ["l", "l", "r", "l"],
                  "rows": [[r["name"], r["kind"], eur(r["unit_price"]), r["unit"]] for r in rows]},
        "note": "Lo que no figura aquí no se puede presupuestar."}]))
    docs.append(_rules_doc(db, "quote_rules", "reglas", "Condiciones para presupuestar", "IVA, descuentos, validez y qué hacer cuando falta algo"))
    return docs


# -- renovaciones ----------------------------------------------------------------------------
def _renovaciones(db: Database, email: dict) -> list[Doc]:
    c = client_for_email(db, email)
    docs: list[Doc] = []
    if c:
        docs.append(_client_doc(c))
        today = email["received_at"][:10]
        pols = db.all("SELECT * FROM policies WHERE client_id=? ORDER BY renewal_date", (c["id"],))
        docs.append(_doc("cartera", "Cartera de pólizas", f"{c['legal_name']} · situación a {_date(today)}", "Cartera", [{
            "table": {"columns": ["Ramo", "Aseguradora", "Nº de póliza", "Vencimiento", "Prima anual", "Siniestros 12 m"], "align": ["l", "l", "l", "r", "r", "r"],
                      "rows": [[p["product"], p["insurer"], p["policy_number"], _date(p["renewal_date"]), eur(p["annual_premium"]), str(p["claims_12m"])] for p in pols]}}]))
        offers = []
        for p in pols:
            if not rv.in_window(rv.days_left(p["renewal_date"], today)):
                continue
            pct = rv.change_pct(p["annual_premium"], p["renewal_premium"])
            offers.append([p["product"], p["insurer"], eur(p["renewal_premium"]) if p["renewal_premium"] is not None else "Pendiente",
                           (f"{pct:+.1f}".replace(".", ",") + " %") if pct is not None else "—", p["renewal_notes"] or "—"])
        docs.append(_doc("ofertas", "Ofertas de renovación recibidas", "De las pólizas que vencen en los próximos 60 días", "Cartera", [{
            "table": {"columns": ["Póliza", "Aseguradora", "Prima propuesta", "Variación", "Observaciones de la aseguradora"], "align": ["l", "l", "r", "r", "l"], "rows": offers},
            "note": "Estas son las condiciones que envía cada aseguradora; el agente las compara con la póliza actual."}]))
    docs.append(_rules_doc(db, "renewal_rules", "reglas", "Criterios de renovación", "Plazos, subidas de prima, coberturas y siniestralidad"))
    return docs


# -- auditor de facturas ---------------------------------------------------------------------------
def _audit_doc(db: Database, d: dict, sup: dict) -> Doc:
    lines = db.all("SELECT item_code, description, quantity, unit_price FROM audit_lines WHERE doc_id=? ORDER BY rowid", (d["id"],))
    kind = d["kind"]
    names = {"pedido": ("Pedido", "Pedidos al proveedor"), "albaran": ("Albarán de entrega", "Albaranes recibidos"), "factura": ("Factura", "Facturas del proveedor")}
    label, group = names[kind]
    head = [["Proveedor", f"{sup['name']} (NIF {sup['tax_id']})"], ["Número", d["number"]], ["Fecha", _date(d["doc_date"])]]
    if d["po_ref"]:
        head.append(["Pedido de referencia", d["po_ref"]])
    elif kind == "factura":
        head.append(["Pedido de referencia", "No consta"])
    if kind == "albaran":
        table = {"columns": ["Código", "Descripción", "Cantidad entregada"], "align": ["l", "l", "r"], "rows": [[l["item_code"], l["description"], f"{l['quantity']:g}".replace(".", ",")] for l in lines]}
    else:
        table = {"columns": ["Código", "Descripción", "Cantidad", "Precio", "Importe"], "align": ["l", "l", "r", "r", "r"],
                 "rows": [[l["item_code"], l["description"], f"{l['quantity']:g}".replace(".", ","), eur(l["unit_price"]), eur(l["quantity"] * l["unit_price"])] for l in lines]}
    sections = [{"fields": head}, {"table": table}]
    if kind == "factura":
        sections.append({"fields": [["Base imponible", eur(d["base"])], ["IVA (21 %)", eur(d["vat"])], ["Total", eur(d["total"])]]})
    return _doc(f"doc-{d['id']}", f"{label} {d['number']}", f"{sup['name']} · {_date(d['doc_date'])}", group, sections)


def _auditor(db: Database, email: dict) -> list[Doc]:
    c = client_for_email(db, email)
    docs: list[Doc] = []
    if c:
        docs.append(_client_doc(c))
        sup = next((s for s in db.all("SELECT * FROM suppliers") if s["name"].replace(" SL", "").replace(" SA", "") in email["body"]), None)
        if sup:
            order = {"pedido": 0, "albaran": 1, "factura": 2}
            rows = db.all("SELECT * FROM audit_documents WHERE client_id=? AND supplier_id=? ORDER BY doc_date, id", (c["id"], sup["id"]))
            rows.sort(key=lambda r: (order[r["kind"]], r["doc_date"], r["id"]))
            docs += [_audit_doc(db, r, sup) for r in rows]
    docs.append(_rules_doc(db, "audit_rules", "reglas", "Criterios de auditoría", "Cómo se cruzan facturas, pedidos y albaranes"))
    return docs


BUILDERS = {"gestion-documental": _documental, "presupuestos": _presupuestos, "renovaciones": _renovaciones, "auditor-facturas": _auditor}


def build_sources(db: Database, agent_id: str, email: dict) -> list[Doc]:
    builder = BUILDERS.get(agent_id)
    return builder(db, email) if builder else []


def light(doc: Doc) -> dict:
    return {k: doc[k] for k in ("id", "title", "subtitle", "group")}
