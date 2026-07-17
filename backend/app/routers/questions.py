from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import get_current_user
from app.models.question import Question
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionRead, QuestionUpdate

sessions_router = APIRouter(prefix="/api/sessions", tags=["questions"])
questions_router = APIRouter(prefix="/api/questions", tags=["questions"])


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
    question = Question(session_id=session_id, author_id=user.id, content=payload.content)
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


@questions_router.get("/unresolved", response_model=list[QuestionRead])
def list_unresolved_questions(db: DBSession = Depends(get_db)):
    return db.query(Question).filter(Question.resolved.is_(False)).all()


@questions_router.patch("/{question_id}", response_model=QuestionRead)
def update_question(question_id: int, payload: QuestionUpdate, db: DBSession = Depends(get_db)):
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "질문을 찾을 수 없습니다")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    db.commit()
    db.refresh(question)
    return question
