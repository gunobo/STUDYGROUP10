from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import require_admin
from app.models.session import Session, SessionStatus
from app.schemas.session import SessionCreate, SessionRead, SessionUpdate

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


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


@router.post("", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    session = Session(**payload.model_dump())
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionRead)
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    return session


@router.patch("/{session_id}", response_model=SessionRead)
def update_session(session_id: int, payload: SessionUpdate, db: DBSession = Depends(get_db)):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(session, field, value)
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")
    db.delete(session)
    db.commit()
