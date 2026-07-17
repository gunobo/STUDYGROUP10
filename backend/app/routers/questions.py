from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import get_current_user, require_admin
from app.models.question import Question
from app.models.session import Session
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionRead, QuestionUpdate

sessions_router = APIRouter(prefix="/api/sessions", tags=["questions"])
questions_router = APIRouter(prefix="/api/questions", tags=["questions"])


def _next_session_id(db: DBSession, current_session: Session) -> int | None:
    """이 세션 이후 가장 먼저 예정된 세션 id — '다음 발표 전까지' 마감 기준."""
    next_session = (
        db.query(Session)
        .filter(Session.scheduled_date > current_session.scheduled_date)
        .order_by(Session.scheduled_date.asc())
        .first()
    )
    return next_session.id if next_session else None


@sessions_router.get("/{session_id}/questions", response_model=list[QuestionRead])
def list_session_questions(session_id: int, db: DBSession = Depends(get_db)):
    return db.query(Question).filter(Question.session_id == session_id).all()


@sessions_router.post(
    "/{session_id}/questions", response_model=QuestionRead, status_code=status.HTTP_201_CREATED
)
def create_question(
    session_id: int,
    payload: QuestionCreate,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = db.get(Session, session_id)
    if session is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "세션을 찾을 수 없습니다")

    question = Question(
        session_id=session_id,
        author_id=user.id,
        content=payload.content,
        resolved_before_session_id=_next_session_id(db, session),
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@questions_router.get("/unresolved", response_model=list[QuestionRead])
def list_unresolved_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: DBSession = Depends(get_db),
):
    return (
        db.query(Question)
        .filter(Question.resolved.is_(False))
        .order_by(Question.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@questions_router.patch("/{question_id}", response_model=QuestionRead)
def update_question(
    question_id: int,
    payload: QuestionUpdate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "질문을 찾을 수 없습니다")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question
