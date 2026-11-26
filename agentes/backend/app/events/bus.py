"""Bus de eventos de una ejecución: persiste cada evento y lo reparte a los suscriptores SSE."""

from __future__ import annotations

import asyncio
import time
from typing import Any

from app.persistence.db import Database, dumps


class RunEventBus:
    def __init__(self, db: Database, run_id: str, agent_id: str = "gestion-documental"):
        self.db = db
        self.run_id = run_id
        self.agent_id = agent_id
        self.seq = 0
        self.t0 = time.monotonic()
        self.closed = False
        self._subscribers: list[asyncio.Queue] = []

    def elapsed_ms(self) -> int:
        return int((time.monotonic() - self.t0) * 1000)

    def emit(self, type_: str, payload: dict[str, Any] | None = None) -> dict:
        self.seq += 1
        payload = {"agent_id": self.agent_id, **(payload or {})}
        event = {"seq": self.seq, "t_ms": self.elapsed_ms(), "type": type_, "payload": payload}
        self.db.execute(
            "INSERT INTO run_events (run_id, seq, t_ms, type, payload) VALUES (?,?,?,?,?)",
            (self.run_id, event["seq"], event["t_ms"], type_, dumps(event["payload"])),
        )
        for q in list(self._subscribers):
            q.put_nowait(event)
        return event

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._subscribers.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        if q in self._subscribers:
            self._subscribers.remove(q)

    def close(self) -> None:
        self.closed = True
        for q in list(self._subscribers):
            q.put_nowait(None)
