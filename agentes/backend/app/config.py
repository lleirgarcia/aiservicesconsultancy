"""Configuración central. Todo lo configurable sale de variables de entorno."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("KROOMIX_DATA_DIR", BACKEND_DIR / "data"))


@dataclass(frozen=True)
class Settings:
    # Proveedor de IA. Solo hay un adaptador implementado: "claude-agent-sdk".
    ai_provider: str = os.environ.get("KROOMIX_AI_PROVIDER", "claude-agent-sdk")
    model: str = os.environ.get("KROOMIX_MODEL", "sonnet")
    effort: str = os.environ.get("KROOMIX_EFFORT", "medium")
    # El coordinador solo decide qué agente usar: un modelo pequeño basta y responde más rápido. Sin «effort» (Haiku no lo admite).
    coordinator_model: str = os.environ.get("KROOMIX_COORDINATOR_MODEL", "haiku")
    max_turns: int = int(os.environ.get("KROOMIX_MAX_TURNS", "60"))
    run_timeout_s: int = int(os.environ.get("KROOMIX_RUN_TIMEOUT_S", "420"))
    # Reintentos de extracción por documento antes de derivarlo a revisión humana.
    max_extraction_attempts: int = int(os.environ.get("KROOMIX_MAX_EXTRACTION_ATTEMPTS", "3"))
    # Hipótesis comerciales (minutos por expediente). Son estimaciones, no mediciones.
    manual_minutes: float = float(os.environ.get("KROOMIX_MANUAL_MINUTES", "15"))
    review_minutes: float = float(os.environ.get("KROOMIX_REVIEW_MINUTES", "2"))
    quote_manual_minutes: float = float(os.environ.get("KROOMIX_QUOTE_MANUAL_MINUTES", "45"))
    quote_review_minutes: float = float(os.environ.get("KROOMIX_QUOTE_REVIEW_MINUTES", "5"))
    renewal_manual_minutes: float = float(os.environ.get("KROOMIX_RENEWAL_MANUAL_MINUTES", "40"))
    renewal_review_minutes: float = float(os.environ.get("KROOMIX_RENEWAL_REVIEW_MINUTES", "8"))
    # Bandeja de entrada externa (IMAP). Desactivada si falta el usuario, la contraseña de aplicación o el alias.
    imap_host: str = os.environ.get("KROOMIX_IMAP_HOST", "imap.gmail.com")
    imap_user: str = os.environ.get("KROOMIX_IMAP_USER", "")
    imap_password: str = field(default=os.environ.get("KROOMIX_IMAP_PASSWORD", ""), repr=False)  # nunca en logs
    imap_alias: str = os.environ.get("KROOMIX_IMAP_ALIAS", "")  # solo se procesa lo enviado a esta dirección
    inbox_poll_s: int = int(os.environ.get("KROOMIX_INBOX_POLL_S", "20"))
    inbox_max_runs_per_hour: int = int(os.environ.get("KROOMIX_INBOX_MAX_RUNS_PER_HOUR", "6"))
    inbox_max_attachment_mb: int = int(os.environ.get("KROOMIX_INBOX_MAX_ATTACHMENT_MB", "10"))
    inbox_allowed_senders: str = os.environ.get("KROOMIX_INBOX_ALLOWED_SENDERS", "")  # vacío = cualquiera

    @property
    def inbox_enabled(self) -> bool:
        return bool(self.imap_user and self.imap_password and self.imap_alias)

    audit_manual_minutes: float = float(os.environ.get("KROOMIX_AUDIT_MANUAL_MINUTES", "60"))
    audit_review_minutes: float = float(os.environ.get("KROOMIX_AUDIT_REVIEW_MINUTES", "10"))
    # Tipo de cambio fijo para mostrar el coste de IA en euros. Es una estimación, no una cotización.
    usd_eur: float = float(os.environ.get("KROOMIX_USD_EUR", "0.92"))
    data_dir: Path = DATA_DIR
    db_path: Path = Path(os.environ.get("KROOMIX_DB", DATA_DIR / "kroomix.db"))
    # Inyección de fallos para evals: {"get_document_history": 1} => la 1.ª llamada falla.
    fault_injection: dict = field(
        default_factory=lambda: json.loads(os.environ.get("KROOMIX_FAULTS", "{}") or "{}")
    )

    # Carpeta de los PDF de presupuesto generados. Los tests y las evals la redirigen a una carpeta temporal.
    quotes_dir_override: Path | None = (Path(os.environ["KROOMIX_QUOTES_DIR"]) if os.environ.get("KROOMIX_QUOTES_DIR") else None)

    @property
    def files_dir(self) -> Path:
        return self.data_dir / "files"

    @property
    def quotes_dir(self) -> Path:
        return self.quotes_dir_override or self.files_dir / "quotes"


def get_settings() -> Settings:
    return Settings()
