"""Lectura del buzón por IMAP. Solo se leen los correos NO LEÍDOS enviados al alias configurado; el resto no se toca."""

from __future__ import annotations

import imaplib
import logging

log = logging.getLogger("kroomix.mail")
MAX_PER_POLL = 10


class ImapSource:
    def __init__(self, host: str, user: str, password: str, alias: str):
        self.host, self.user, self.alias = host, user, alias
        self._password = password

    def _connect(self) -> imaplib.IMAP4_SSL:
        conn = imaplib.IMAP4_SSL(self.host, timeout=30)
        conn.login(self.user, self._password)
        conn.select("INBOX")
        return conn

    def fetch_new(self) -> list[tuple[bytes, bytes]]:
        """[(uid, mensaje completo)] de los no leídos dirigidos al alias. No los marca como leídos (BODY.PEEK)."""
        conn = self._connect()
        try:
            alias = f'"{self.alias}"'
            typ, data = conn.uid("SEARCH", None, "UNSEEN", "OR", "TO", alias, "HEADER", "Delivered-To", alias)  # type: ignore[arg-type]
            uids = data[0].split()[:MAX_PER_POLL] if typ == "OK" and data and data[0] else []
            out = []
            for uid in uids:
                typ, parts = conn.uid("FETCH", uid, "(BODY.PEEK[])")
                if typ == "OK" and parts and isinstance(parts[0], tuple):
                    out.append((uid, parts[0][1]))
            return out
        finally:
            _close(conn)

    def mark_seen(self, uids: list[bytes]) -> None:
        if not uids:
            return
        conn = self._connect()
        try:
            for uid in uids:
                conn.uid("STORE", uid, "+FLAGS", "(\\Seen)")
        finally:
            _close(conn)


def _close(conn: imaplib.IMAP4_SSL) -> None:
    try:
        conn.logout()
    except Exception:  # noqa: BLE001
        pass
