from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import get_current_user, require_admin
from app.models.application import Application, ApplicationStatus
from app.models.session import Session, SessionClaimStatus, SessionStatus
from app.models.user import User
from app.schemas.session import SessionClaim, SessionCreate, SessionRead, SessionUpdate
from app.senders.discord import send_discord_message
from app.senders.discord_events import create_scheduled_event, delete_scheduled_event

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

MAX_PRESENTERS_PER_DATE = 3


@router.get("", response_model=list[SessionRead])
def list_sessions(
    date_: date | None = None,
    presenter_id: int | None = None,
    status_: SessionStatus | None = None,
    db: DBSession = Depends(get_db),
):
    query = db.query(Session)
    if date_ is not None:
        query = query.filter(Session.scheduled_date == date_)
    if presenter_id is not None:
        query = query.filter(Session.presenter_id == presenter_id)
    if status_ is not None:
        query = query.filter(Session.status == status_)
    return query.order_by(Session.scheduled_date).all()


@router.get("/open", response_model=list[SessionRead])
def list_open_sessions(db: DBSession = Depends(get_db)):
    """발표자가 아직 배정되지 않은, 신청 가능한 날짜 목록."""
    return (
        db.query(Session)
        .filter(Session.presenter_id.is_(None))
        .order_by(Session.scheduled_date)
        .all()
    )


@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(payload: SessionCreate, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    existing_count = (
        db.query(Session)
        .filter(Session.scheduled_date == payload.scheduled_date, Session.status != SessionStatus.canceled)
        .count()
    )
    if existing_count >= MAX_PRESENTERS_PER_DATE:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"해당 날짜에는 이미 발표자가 {MAX_PRESENTERS_PER_DATE}명 배정되어 있습니다",
        )

    session = Session(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)

    if session.presenter_id is None:
        await send_discord_message(f"📅 새로운 발표 날짜가 열렸습니다: **{session.scheduled_date}** — 마이페이지에서 신청하세요!")

    return session


@router.get("/{session_id}", response_model=SessionRead)
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    return session


@router.patch("/{session_id}", response_model=SessionRead)
async def update_session(
    session_id: int,
    payload: SessionUpdate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)

    if payload.status == SessionStatus.canceled and session.discord_event_id:
        await delete_scheduled_event(db, session.discord_event_id)
        session.discord_event_id = None

    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: int, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")

    if session.discord_event_id:
        await delete_scheduled_event(db, session.discord_event_id)

    db.delete(session)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "관련된 질문/피드백/출석/벌금 기록이 있어 삭제할 수 없습니다. 대신 상태를 '취소'로 변경해주세요.",
        )


@router.post("/{session_id}/claim", response_model=SessionRead)
async def claim_session(
    session_id: int,
    payload: SessionClaim,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    if session.presenter_id is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "이미 신청된 날짜입니다")

    approved = (
        db.query(Application)
        .filter(Application.user_id == user.id, Application.status == ApplicationStatus.approved)
        .first()
    )
    if approved is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "승인된 참가자만 발표를 신청할 수 있습니다")

    session.presenter_id = user.id
    session.topic = payload.topic
    session.claim_status = SessionClaimStatus.pending
    db.commit()
    db.refresh(session)

    await send_discord_message(
        f"📝 **{user.name}**님이 **{session.scheduled_date}** 발표를 신청했습니다 (관리자 승인 대기 중)\n주제: {session.topic}"
    )

    return session


@router.post("/{session_id}/approve", response_model=SessionRead)
async def approve_claim(session_id: int, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    if session.claim_status != SessionClaimStatus.pending:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "승인 대기 중인 신청이 아닙니다")

    presenter = db.get(User, session.presenter_id)

    session.claim_status = SessionClaimStatus.approved
    db.commit()
    db.refresh(session)

    await send_discord_message(
        f"✅ **{session.scheduled_date}** 발표가 확정됐습니다! 발표자: **{presenter.name}** · 주제: {session.topic}"
    )

    event_id = await create_scheduled_event(db, session.scheduled_date, session.topic, presenter.name)
    if event_id:
        session.discord_event_id = event_id
        db.commit()
        db.refresh(session)

    return session


@router.post("/{session_id}/reject", response_model=SessionRead)
async def reject_claim(session_id: int, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    if session.claim_status != SessionClaimStatus.pending:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "승인 대기 중인 신청이 아닙니다")

    session.presenter_id = None
    session.topic = None
    session.claim_status = None
    db.commit()
    db.refresh(session)

    return session
