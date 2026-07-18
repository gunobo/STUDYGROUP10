import asyncio

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import require_admin
from app.models.application import Application, ApplicationStatus
from app.models.session import Session, SessionClaimStatus
from app.models.user import User
from app.schemas.session import SessionRead
from app.schemas.user import ChecklistItem, UserRead, UserUpdate
from app.senders.discord_events import check_guild_membership

router = APIRouter(prefix="/api/users", tags=["users"])

CONTENT_FIELDS = ("concept_note", "example_note", "demo_note", "summary_note")


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


@router.get("/checklist", response_model=list[ChecklistItem])
async def user_checklist(db: DBSession = Depends(get_db), _=Depends(require_admin)):
    """승인된 참가자별로 발표 횟수/자료 작성 여부/디스코드 참여 여부를 한눈에 보여준다."""
    applications = (
        db.query(Application)
        .filter(Application.status == ApplicationStatus.approved)
        .order_by(Application.created_at.desc())
        .all()
    )
    latest_by_user: dict[int, Application] = {}
    for application in applications:
        latest_by_user.setdefault(application.user_id, application)

    rows = []
    for user_id, application in latest_by_user.items():
        user = db.get(User, user_id)
        if user is None:
            continue

        presentation_count = (
            db.query(Session)
            .filter(Session.presenter_id == user_id, Session.claim_status == SessionClaimStatus.approved)
            .count()
        )
        latest_session = (
            db.query(Session).filter(Session.presenter_id == user_id).order_by(Session.scheduled_date.desc()).first()
        )
        content_complete = None
        if latest_session is not None:
            content_complete = all(bool((getattr(latest_session, field) or "").strip()) for field in CONTENT_FIELDS)

        rows.append((user, application, presentation_count, latest_session, content_complete))

    async def _maybe_check(discord_id: str | None) -> bool | None:
        if not discord_id:
            return None
        return await check_guild_membership(db, discord_id)

    discord_results = await asyncio.gather(*(_maybe_check(application.discord_id) for _, application, *_ in rows))

    items = [
        ChecklistItem(
            user_id=user.id,
            name=user.name,
            email=user.email,
            presentation_count=presentation_count,
            latest_session_id=latest_session.id if latest_session else None,
            latest_session_date=latest_session.scheduled_date if latest_session else None,
            content_complete=content_complete,
            discord_id=application.discord_id,
            discord_joined=discord_joined,
        )
        for (user, application, presentation_count, latest_session, content_complete), discord_joined in zip(
            rows, discord_results
        )
    ]
    items.sort(key=lambda item: item.name)
    return items


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
