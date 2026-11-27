"""Contraseñas (scrypt) y tokens de sesión."""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets

_N, _R, _P = 2**14, 8, 1


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P, dklen=32)
    return f"scrypt${salt.hex()}${h.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    """Tiempo constante; si no hay hash (usuario inexistente) se compara igualmente contra uno falso."""
    try:
        _, salt, digest = (stored or "scrypt$00$00").split("$")
        h = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=_N, r=_R, p=_P, dklen=32)
        return hmac.compare_digest(h, bytes.fromhex(digest)) and stored is not None
    except ValueError:
        return False


def new_token() -> str:
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def generate_password() -> str:
    """Legible y sin caracteres ambiguos (se la das tú al cliente)."""
    alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(12))
