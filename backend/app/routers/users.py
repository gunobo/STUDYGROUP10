from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import require_admin
from app.models.application import Application, ApplicationStatus
from app.models.session import Session
from app.models.user import User
from app.schemas.session import SessionRead
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


class UserDetail(UserRead):
    sessions: list[SessionRead] = []


@router.get("", response_model=list[UserRead])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=500),
    approved_only: bool = False,
    db: DBSession = Depends(get_db),
):
    query = db.query(User)
    if approved_only:
        query = (
            query.join(Application, Application.user_id == User.id)
            .filter(Application.status == ApplicationStatus.approved)
            .distinct()
        )
    return query.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserDetail)
def get_user(user_id: int, db: DBSession = Depends(get_db)):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다")
    sessions = db.query(Session).filter(Session.presenter_id == user_id).all()
    return UserDetail(**UserRead.model_validate(user).model_dump(), sessions=sessions)


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "사용자를 찾을 수 없습니다")
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
