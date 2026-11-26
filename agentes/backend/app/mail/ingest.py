"""Correos externos: interpretar un mensaje (RFC 822) y guardarlo como una petición más de la plataforma.

Todo lo que llega de fuera es NO CONFIABLE: se guarda como dato, los adjuntos se validan por su contenido (no por el nombre
ni el tipo que declare el remitente) y solo se aceptan PDF e imágenes legibles.
"""

from __future__ import annotations

import email
import hashlib
import html
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime
from email import policy
from email.utils import parseaddr, parsedate_to_datetime
from pathlib import Path

from app.config import Settings
from app.persistence.db import Database
from app.seed.render_img import render_preview

log = logging.getLogger("kroomix.mail")
MAX_BODY = 8000
MAX_ATTACHMENTS = 8


@dataclass
class Inbound:
    message_id: str
    from_name: str
    from_address: str
    subject: str
    body: str
    sent_at: datetime
    attachments: list[tuple[str, bytes]] = field(default_factory=list)
    skipped: list[str] = field(default_factory=list)  # adjuntos descartados (tipo no admitido, demasiado grandes…)


def _sniff(data: bytes) -> tuple[str, str] | None:
    """Tipo real del fichero por su contenido: (mime, extensión)."""
    if data.startswith(b"%PDF"):
        return "application/pdf", ".pdf"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg", ".jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png", ".png"
    return None


def _clean_name(name: str | None, fallback: str) -> str:
    base = re.sub(r"[^\w .()\-áéíóúàèòçñüÁÉÍÓÚÀÈÒÇÑÜ]", "_", (name or fallback).replace("\\", "/").split("/")[-1]).strip(" .")
    return (base or fallback)[:120]


def _text_of(msg: email.message.EmailMessage) -> str:
    part = msg.get_body(preferencelist=("plain", "html"))
    if part is None:
        return ""
    text = part.get_content()
    if part.get_content_type() == "text/html":
        text = html.unescape(re.sub(r"<(script|style).*?</\1>|<[^>]+>", " ", text, flags=re.S | re.I))
    return re.sub(r"[ \t]+\n", "\n", re.sub(r"\n{3,}", "\n\n", text.replace("\r\n", "\n"))).strip()[:MAX_BODY]


def parse_message(raw: bytes, max_attachment_bytes: int = 10 * 1024 * 1024) -> Inbound:
    msg = email.message_from_bytes(raw, policy=policy.default)
    name, addr = parseaddr(str(msg.get("From", "")))
    try:
        sent = parsedate_to_datetime(str(msg["Date"])).astimezone().replace(tzinfo=None)
    except Exception:  # noqa: BLE001 - fecha ausente o mal formada
        sent = datetime.now()
    mid = (str(msg.get("Message-ID") or "").strip()) or "sha:" + hashlib.sha256(raw).hexdigest()
    out = Inbound(mid, name or addr, addr.lower(), str(msg.get("Subject", "")).strip() or "(sin asunto)", _text_of(msg), sent)
    for i, part in enumerate(msg.iter_attachments(), start=1):
        data = part.get_payload(decode=True) or b""
        filename = _clean_name(part.get_filename(), f"adjunto-{i}")
        if len(out.attachments) >= MAX_ATTACHMENTS or len(data) > max_attachment_bytes or not _sniff(data):
            out.skipped.append(filename)
            continue
        out.attachments.append((filename, data))
    return out


def email_id_for(message_id: str) -> str:
    return "email-ext-" + hashlib.sha1(message_id.encode()).hexdigest()[:10]


def store(db: Database, settings: Settings, m: Inbound) -> str | None:
    """Guarda el correo y sus adjuntos. Devuelve su identificador, o None si ya se había recibido."""
    email_id = email_id_for(m.message_id)
    now = datetime.now().isoformat(timespec="seconds")
    if db.execute("INSERT OR IGNORE INTO inbound_emails (message_id, email_id, status, received_at, updated_at) VALUES (?,?,?,?,?)",
                  (m.message_id, email_id, "pendiente", m.sent_at.isoformat(timespec="seconds"), now)) == 0:
        return None
    folder = settings.files_dir / "inbound" / email_id
    saved = []
    for pos, (filename, data) in enumerate(m.attachments, start=1):
        mime, ext = _sniff(data)  # type: ignore[misc]
        att_id = f"{email_id}-a{pos}"
        path = folder / f"{att_id}{ext}"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        preview = settings.files_dir / "previews" / f"{att_id}.png"
        try:
            pages = render_preview(path, preview)
        except Exception:  # noqa: BLE001 - fichero corrupto o ilegible: se descarta
            path.unlink(missing_ok=True)
            m.skipped.append(filename)
            continue
        saved.append((att_id, len(saved) + 1, filename, mime, str(path.relative_to(settings.files_dir)),
                      str(preview.relative_to(settings.files_dir)), len(data), hashlib.sha256(data).hexdigest(), pages))
    note = f"Adjuntos descartados: {', '.join(m.skipped)}." if m.skipped else None
    db.execute("INSERT INTO emails VALUES (?,?,?,?,?,?,?,?,?)",
               (email_id, "external", m.from_name, m.from_address, settings.imap_alias or "", m.subject, m.body,
                m.sent_at.isoformat(timespec="seconds"), m.sent_at.strftime("%Y-%m")))
    for att_id, pos, filename, mime, rel, prev, size, sha, pages in saved:
        db.execute("INSERT INTO attachments VALUES (?,?,?,?,?,?,?,?,?,?)", (att_id, email_id, pos, filename, mime, rel, prev, size, sha, pages))
    if note:
        db.execute("UPDATE inbound_emails SET note=? WHERE message_id=?", (note, m.message_id))
    return email_id
