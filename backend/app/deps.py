from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.core.security import decode_access_token
from app.db.base import get_db
from app.models.user import User, UserRole


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: DBSession = Depends(get_db),
) -> User:
    if access_token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다")

    user_id = decode_access_token(access_token)
    if user_id is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "유효하지 않은 토큰입니다")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "사용자를 찾을 수 없습니다")

    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "관리자만 접근할 수 있습니다")
    return user
