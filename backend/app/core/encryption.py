from __future__ import annotations

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


class EncryptionConfigurationError(RuntimeError):
    pass


def _get_fernet() -> Fernet:
    key = settings.TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY.strip()
    if not key:
        raise EncryptionConfigurationError("TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY is not configured")

    try:
        return Fernet(key.encode("utf-8"))
    except Exception as exc:  # pragma: no cover - defensive validation
        raise EncryptionConfigurationError("Invalid TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY format") from exc


def encrypt_secret(value: str) -> str:
    if not value.strip():
        raise ValueError("Secret value cannot be empty")
    return _get_fernet().encrypt(value.strip().encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str) -> str:
    if not value:
        raise ValueError("Encrypted secret is missing")
    try:
        return _get_fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise EncryptionConfigurationError("Unable to decrypt Telegram bot token") from exc


def mask_secret(value: str | None) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    if len(trimmed) <= 8:
        return "*" * len(trimmed)
    return f"{trimmed[:4]}{'*' * (len(trimmed) - 8)}{trimmed[-4:]}"
