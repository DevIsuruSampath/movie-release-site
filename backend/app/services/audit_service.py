from __future__ import annotations

from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


def create_audit_log(
    db: Session,
    request: Request | None,
    actor: User | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    description: str | None = None,
    metadata_json: dict[str, Any] | None = None,
) -> AuditLog:
    log = AuditLog(
        actor_id=actor.id if actor else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_json=metadata_json,
        description=description,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )
    db.add(log)
    return log
