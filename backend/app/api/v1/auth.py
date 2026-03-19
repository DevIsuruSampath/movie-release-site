from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_and_validate_token,
    get_current_admin_user,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.db.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.user import AdminUserCreate, TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter()


def create_audit_log(
    db: Session,
    request: Request | None,
    actor_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    description: str,
    metadata_json: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            metadata_json=metadata_json,
            ip_address=request.client.host if request and request.client else None,
            user_agent=request.headers.get("user-agent") if request else None,
        )
    )


def _build_token_response(user: User) -> TokenResponse:
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(user_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    create_audit_log(
        db,
        request,
        user.id,
        "login",
        "user",
        user.id,
        f"{user.email} logged in",
    )
    db.commit()
    return _build_token_response(user)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: dict, db: Session = Depends(get_db)):
    refresh_token_value = payload.get("refresh_token")
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh token required")

    decoded = decode_and_validate_token(refresh_token_value, expected_type="refresh")
    user_id = decoded.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first() if user_id else None
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    return _build_token_response(user)


@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, request: Request, db: Session = Depends(get_db)):
    if not settings.ALLOW_PUBLIC_REGISTRATION:
        if not user_data.registration_code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Registration code is required")
        if user_data.registration_code != settings.ADMIN_REGISTRATION_CODE:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid registration code")

    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    is_first_user = db.query(User).count() == 0
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_superuser=is_first_user,
        is_admin=is_first_user,
    )
    db.add(user)
    db.flush()
    create_audit_log(
        db,
        request,
        user.id,
        "register",
        "user",
        user.id,
        f"User {user.email} registered",
    )
    db.commit()
    db.refresh(user)
    return user


@router.post("/admin/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user_admin(
    user_data: AdminUserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_superuser=user_data.is_superuser,
        is_admin=user_data.is_admin or user_data.is_superuser,
    )
    db.add(user)
    db.flush()
    create_audit_log(
        db,
        request,
        current_admin.id,
        "create",
        "user",
        user.id,
        f"Created user {user.email}",
        {"email": user.email},
    )
    db.commit()
    db.refresh(user)
    return user
