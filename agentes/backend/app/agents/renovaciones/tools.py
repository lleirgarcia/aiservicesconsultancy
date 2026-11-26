"""Herramientas del agente de renovaciones.

Qué pólizas entran, qué alertas tiene cada una y cuánto dinero está en juego lo calcula el sistema.
El modelo solo recomienda y redacta, y no puede recomendar «renovar» una póliza con alertas.
Integraciones locales (SQLite); pensadas para sustituirse por el programa de gestión de la correduría.
"""

from __future__ import annotations

import hashlib
import json

from typing import Literal

from pydantic import Field

from app.persistence.db import dumps
from app.tools import catalog as doc_tools
from app.tools.base import RunContext, ToolError, ToolOutcome, ToolSpec, now_iso
from app.tools.catalog import DraftIn, FindClientIn, LogEventIn, ReviewTaskIn, Strict
from app.validation import quotes as qv
from app.validation import renewals as rv

IssueKind = Literal["dato_faltante", "instruccion_sospechosa", "cliente_nuevo", "condicion_solicitada"]
Recommendation = Literal["renovar", "renegociar", "buscar_alternativas"]
FORBIDDEN_IN_DRAFT = ("comisión", "comision", "comisiones", "retrocesión", "margen de la correduría")


class NoInput(Strict):
    pass


def _today(ctx: RunContext) -> str:
    return ctx.email()["received_at"][:10]


def _policy_view(p: dict, today: str) -> dict:
    d = rv.days_left(p["renewal_date"], today)
    return {"policy_id": p["id"], "insurer": p["insurer"], "product": p["product"], "policy_number": p["policy_number"],
            "renewal_date": p["renewal_date"], "days_left": d, "in_window": rv.in_window(d), "urgent": rv.in_window(d) and d <= rv.URGENT_DAYS,
            "current_premium": p["annual_premium"], "renewal_premium": p["renewal_premium"],
            "change_pct": rv.change_pct(p["annual_premium"], p["renewal_premium"]),
            "coverage_reduced": bool(p["coverage_reduced"]), "claims_12m": p["claims_12m"], "renewal_notes": p["renewal_notes"],
            "flags": rv.policy_flags(p) if rv.in_window(d) else []}


# -- consulta ---------------------------------------------------------------
def get_renewal_rules(ctx: RunContext, a: NoInput) -> ToolOutcome:
    rules = ctx.db.all("SELECT code, title, body FROM renewal_rules ORDER BY code")
    return ToolOutcome({"rules": rules, "window_days": rv.WINDOW_DAYS, "today": _today(ctx)})


class ClientIn(Strict):
    client_id: str = Field(description="Identificador del cliente.")


def list_client_policies(ctx: RunContext, a: ClientIn) -> ToolOutcome:
    if not ctx.db.one("SELECT id FROM clients WHERE id=?", (a.client_id,)):
        raise ToolError(f"No existe el cliente {a.client_id}.", "unknown_client")
    today = _today(ctx)
    rows = ctx.db.all("SELECT * FROM policies WHERE client_id=? ORDER BY renewal_date", (a.client_id,))
    policies = [_policy_view(p, today) for p in rows]
    return ToolOutcome({"today": today, "policies": policies, "in_window": sum(1 for p in policies if p["in_window"]),
                        "note": "Solo se gestionan las pólizas con in_window=true. Las alertas (flags) las calcula el sistema."})


# -- revisión ------------------------------------------------------------------
class OpenRenewalIn(Strict):
    client_id: str | None = Field(None, description="Identificador del cliente, si se ha identificado.")


def open_renewal(ctx: RunContext, a: OpenRenewalIn) -> ToolOutcome:
    email = ctx.email()
    existing = ctx.db.one("SELECT * FROM cases WHERE run_id=? AND email_id=?", (ctx.run_id, ctx.email_id))
    if existing:
        case_id, created = existing["id"], False
    else:
        if a.client_id and not ctx.db.one("SELECT id FROM clients WHERE id=?", (a.client_id,)):
            raise ToolError(f"No existe el cliente {a.client_id}.", "unknown_client")
        n = (ctx.db.one("SELECT count(*) AS n FROM cases WHERE id LIKE 'REN-%'")["n"] or 0) + 1
        case_id = f"REN-{email['period'].replace('-', '')}-{n:04d}"
        ctx.db.execute("INSERT INTO cases (id, run_id, email_id, client_id, period, status, opened_at) VALUES (?,?,?,?,?,?,?)",
                       (case_id, ctx.run_id, ctx.email_id, a.client_id, email["period"], "en_proceso", now_iso()))
        ctx.db.execute("UPDATE runs SET case_id=? WHERE id=?", (case_id, ctx.run_id))
        created = True
    ctx.case_id, ctx.period = case_id, email["period"]
    ctx.client_id = a.client_id or (existing or {}).get("client_id")
    return ToolOutcome({"renewal_id": case_id, "created": created, "client_id": ctx.client_id, "period": email["period"]})


class ReviewPolicyIn(Strict):
    policy_id: str = Field(description="Identificador de la póliza (debe vencer dentro de la ventana de gestión).")
    recommendation: Recommendation = Field(description="Qué recomiendas: renovar, renegociar con la aseguradora o buscar alternativas. Con alertas no se puede recomendar «renovar».")
    rationale: str = Field(min_length=8, max_length=300, description="Motivo breve de la recomendación, basado en los datos de la póliza.")


def _auto_incident(ctx: RunContext, key: str, kind: str, title: str, detail: str) -> bool:
    return ctx.db.execute("INSERT OR IGNORE INTO incidents VALUES (?,?,?,?,?,?,?,?)",
                          (ctx.case_id, key, kind, title, detail, None, "Revisión de la póliza", now_iso())) > 0


def _flag_detail(p: dict, flag: str) -> tuple[str, str]:
    name = p["product"]
    if flag == "subida_prima":
        pct = rv.change_pct(p["annual_premium"], p["renewal_premium"])
        return (f"{rv.FLAG_TITLES[flag]} del {str(pct).replace('.', ',')}%: {name}",
                f"La prima pasa de {p['annual_premium']:.2f} € a {p['renewal_premium']:.2f} € (el límite sin revisión es el {rv.MAX_INCREASE_PCT}%).")
    if flag == "cobertura_reducida":
        return f"{rv.FLAG_TITLES[flag]}: {name}", p["renewal_notes"] or "La renovación recorta coberturas o límites."
    if flag == "siniestralidad":
        return f"{rv.FLAG_TITLES[flag]}: {name}", f"{p['claims_12m']} siniestros en los últimos 12 meses (límite sin revisión: {rv.CLAIMS_THRESHOLD})."
    return f"{rv.FLAG_TITLES[flag]}: {name}", "La aseguradora todavía no ha enviado las condiciones de renovación."


def review_policy(ctx: RunContext, a: ReviewPolicyIn) -> ToolOutcome:
    case_id = ctx.require_case()
    p = ctx.db.one("SELECT * FROM policies WHERE id=?", (a.policy_id,))
    if not p or p["client_id"] != ctx.client_id:
        valid = ", ".join(r["id"] for r in ctx.db.all("SELECT id FROM policies WHERE client_id=?", (ctx.client_id,))) if ctx.client_id else "(ninguna: no hay cliente identificado)"
        raise ToolError(f"La póliza '{a.policy_id}' no es de este cliente. Pólizas válidas: {valid}.", "unknown_policy")
    view = _policy_view(p, _today(ctx))
    if not view["in_window"]:
        raise ToolError(f"La póliza vence en {view['days_left']} días ({view['renewal_date']}), fuera de los {rv.WINDOW_DAYS} días que se gestionan. No se revisa.", "outside_window")
    flags = view["flags"]
    if flags and a.recommendation == "renovar":
        raise ToolError("Esta póliza tiene alertas (" + ", ".join(rv.FLAG_TITLES[f].lower() for f in flags) + "): no se puede recomendar «renovar» sin revisión. "
                        "Recomienda renegociar o buscar alternativas y deja la tarea para el corredor.", "flags_require_review")
    ctx.db.execute("INSERT OR REPLACE INTO renewal_reviews VALUES (?,?,?,?,?,?)",
                   (case_id, p["id"], a.recommendation, a.rationale, json.dumps(flags), view["days_left"]))
    alerts = []
    for f in flags:
        title, detail = _flag_detail(p, f)
        _auto_incident(ctx, f"{p['id']}:{f}", f, title, detail)
        alerts.append({"kind": f, "title": title, "detail": detail})
    return ToolOutcome({**view, "recommendation": a.recommendation, "rationale": a.rationale, "alerts": alerts})


class FlagIssueIn(Strict):
    kind: IssueKind
    title: str = Field(max_length=140)
    detail: str = Field(max_length=500)
    source_text: str | None = Field(None, max_length=300, description="Fragmento literal de la solicitud que origina la incidencia, si lo hay.")


def flag_issue(ctx: RunContext, a: FlagIssueIn) -> ToolOutcome:
    case_id = ctx.require_case()
    if a.source_text:
        email = ctx.email()
        if not qv.source_in_request(a.source_text, email["subject"], email["body"]):
            raise ToolError("El fragmento citado no aparece en la solicitud. Cita literalmente el texto.", "source_not_in_request")
    key = f"{a.kind}:{hashlib.sha1(a.title.casefold().encode()).hexdigest()[:8]}"
    created = ctx.db.execute("INSERT OR IGNORE INTO incidents VALUES (?,?,?,?,?,?,?,?)",
                             (case_id, key, a.kind, a.title, a.detail, None, a.source_text or "Solicitud", now_iso())) > 0
    return ToolOutcome({"flagged": True, "created": created, "kind": a.kind,
                        "next_step": "Crea una tarea de revisión para esta incidencia antes de cerrar la renovación."})


def prepare_email_draft(ctx: RunContext, a: DraftIn) -> ToolOutcome:
    text = (a.subject + " " + a.body).casefold()
    leaked = [w for w in FORBIDDEN_IN_DRAFT if w in text]
    if leaked:
        raise ToolError(f"El correo no puede mencionar información interna ({', '.join(leaked)}). Quítala y vuelve a prepararlo.", "confidential")
    return doc_tools.prepare_email_draft(ctx, a)


# -- cierre ----------------------------------------------------------------------
class FinalizeIn(Strict):
    summary: str = Field(max_length=1500, description="Resumen breve de la revisión para el empleado que la validará.")


def _reviews(ctx: RunContext) -> list[dict]:
    rows = ctx.db.all("SELECT r.*, p.insurer, p.product, p.policy_number, p.renewal_date, p.annual_premium, p.renewal_premium, p.renewal_notes, "
                      "p.coverage_reduced, p.claims_12m, p.commission_pct FROM renewal_reviews r JOIN policies p ON p.id=r.policy_id "
                      "WHERE r.case_id=? ORDER BY r.days_left, r.rowid", (ctx.require_case(),))
    for r in rows:
        r["flags"] = json.loads(r["flags"])
    return rows


def _in_window_policies(ctx: RunContext) -> list[dict]:
    if not ctx.client_id:
        return []
    today = _today(ctx)
    return [p for p in ctx.db.all("SELECT * FROM policies WHERE client_id=? ORDER BY renewal_date", (ctx.client_id,))
            if rv.in_window(rv.days_left(p["renewal_date"], today))]


def build_renewal_result(ctx: RunContext) -> dict:
    case = ctx.db.one("SELECT * FROM cases WHERE id=?", (ctx.case_id,))
    client = ctx.db.one("SELECT legal_name, tax_id, contact_name, contact_email FROM clients WHERE id=?", (case["client_id"],)) if case["client_id"] else None
    reviews = _reviews(ctx)
    items = [{"policy_id": r["policy_id"], "insurer": r["insurer"], "product": r["product"], "policy_number": r["policy_number"],
              "renewal_date": r["renewal_date"], "days_left": r["days_left"], "urgent": r["days_left"] <= rv.URGENT_DAYS,
              "current_premium": r["annual_premium"], "renewal_premium": r["renewal_premium"],
              "change_pct": rv.change_pct(r["annual_premium"], r["renewal_premium"]), "flags": r["flags"],
              "recommendation": r["recommendation"], "rationale": r["rationale"], "renewal_notes": r["renewal_notes"]} for r in reviews]
    totals = rv.compute_renewals([{**r, "days_left": r["days_left"]} for r in reviews]) if reviews else None
    incidents = ctx.db.all("SELECT kind, title, detail, source FROM incidents WHERE case_id=? ORDER BY rowid", (ctx.case_id,))
    tasks = ctx.db.all("SELECT id, title, reason, priority FROM review_tasks WHERE case_id=? ORDER BY rowid", (ctx.case_id,))
    draft = ctx.db.one("SELECT id, to_address, subject, body, status FROM email_drafts WHERE case_id=?", (ctx.case_id,))
    email = ctx.email()
    return {
        "renewal_id": ctx.case_id, "period": case["period"], "today": _today(ctx), "client": client,
        "requester": {"name": email["from_name"], "email": email["from_address"]},
        "policies": items, "totals": {k: v for k, v in totals.items() if k != "internal"} if totals else None,
        "internal": totals["internal"] if totals else None,  # solo para la correduría
        "incidents": incidents, "review_tasks": [{"task_id": t["id"], **{k: t[k] for k in ("title", "reason", "priority")}} for t in tasks],
        "email_draft": draft, "summary": case["summary"], "status": "listo_para_revision" if items else "sin_vencimientos",
    }


def finalize_renewal(ctx: RunContext, a: FinalizeIn) -> ToolOutcome:
    case_id = ctx.require_case()
    reviewed = {r["policy_id"] for r in _reviews(ctx)}
    missing = [p for p in _in_window_policies(ctx) if p["id"] not in reviewed]
    if missing:
        raise ToolError("Quedan pólizas dentro de la ventana sin revisar: " + ", ".join(f"{p['id']} ({p['product']})" for p in missing) + ". Revísalas antes de cerrar.", "unreviewed_policies")
    n_inc = ctx.db.one("SELECT count(*) AS n FROM incidents WHERE case_id=?", (case_id,))["n"]
    n_tasks = ctx.db.one("SELECT count(*) AS n FROM review_tasks WHERE case_id=?", (case_id,))["n"]
    if n_tasks < n_inc:
        titles = [r["title"] for r in ctx.db.all("SELECT title FROM incidents WHERE case_id=?", (case_id,))]
        raise ToolError(f"Hay {n_inc} incidencias y solo {n_tasks} tareas de revisión. Cada incidencia necesita su tarea de revisión humana: "
                        + "; ".join(titles) + ".", "missing_review_tasks")
    has_items = bool(reviewed)
    ctx.db.execute("UPDATE cases SET status=?, closed_at=?, summary=? WHERE id=?",
                   ("listo_para_revision" if has_items else "sin_vencimientos", now_iso(), a.summary, case_id))
    result = build_renewal_result(ctx)
    ctx.db.execute("UPDATE cases SET result=? WHERE id=?", (dumps(result), case_id))
    ctx.finalized = True
    return ToolOutcome({"renewal_id": case_id, "status": result["status"], "totals": result["totals"], "policies": len(result["policies"]),
                        "incidents": len(result["incidents"]), "instruction": "Revisión cerrada. Termina aquí."})


TOOLS: list[ToolSpec] = [
    ToolSpec("find_client", "Busca al cliente en la cartera por NIF, correo o nombre.", FindClientIn, doc_tools.find_client),
    ToolSpec("get_renewal_rules", "Reglas internas para gestionar renovaciones (ventana, urgencia, subidas de prima, coberturas, confidencialidad).", NoInput, get_renewal_rules),
    ToolSpec("list_client_policies", "Todas las pólizas del cliente con vencimiento, prima actual, oferta de renovación y alertas calculadas por el sistema. Solo se gestionan las que tienen in_window=true.", ClientIn, list_client_policies),
    ToolSpec("open_renewal", "Abre la revisión de renovaciones de este cliente.", OpenRenewalIn, open_renewal, read_only=False),
    ToolSpec("review_policy", "Revisa una póliza que vence en la ventana y registra tu recomendación (renovar, renegociar o buscar alternativas). El sistema calcula las alertas; con alertas no se puede recomendar «renovar».",
             ReviewPolicyIn, review_policy, read_only=False),
    ToolSpec("flag_issue", "Señala una incidencia: dato que falta, instrucción sospechosa, cliente nuevo o condición pedida que no consta en la oferta.", FlagIssueIn, flag_issue, read_only=False),
    ToolSpec("create_review_task", "Crea una tarea para que un empleado revise algo. Obligatoria por cada incidencia o alerta.", ReviewTaskIn, doc_tools.create_review_task, read_only=False),
    ToolSpec("prepare_email_draft", "Prepara el borrador de correo para el cliente. Nunca se envía sin aprobación humana. No puede mencionar comisiones ni datos internos.", DraftIn, prepare_email_draft, read_only=False),
    ToolSpec("log_event", "Anota en la traza de auditoría un hecho relevante.", LogEventIn, doc_tools.log_event, read_only=False),
    ToolSpec("finalize_renewal", "Cierra la revisión. Exige haber revisado todas las pólizas de la ventana y una tarea por cada incidencia.", FinalizeIn, finalize_renewal, read_only=False),
]
