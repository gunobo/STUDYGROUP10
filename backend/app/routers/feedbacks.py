from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import get_current_user
from app.models.feedback import Feedback
from app.models.user import User
from app.schemas.feedback import FeedbackCreate, FeedbackRead

router = APIRouter(prefix="/api/sessions", tags=["feedbacks"])


@router.get("/{session_id}/feedbacks", response_model=list[FeedbackRead])
def list_session_feedbacks(session_id: int, db: DBSession = Depends(get_db)):
    return db.query(Feedback).filter(Feedback.session_id == session_id).all()


@router.post(
    "/{session_id}/feedbacks", response_model=FeedbackRead, status_code=status.HTTP_201_CREATED
)
def create_feedback(
    session_id: int,
    payload: FeedbackCreate,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    feedback = Feedback(session_id=session_id, author_id=user.id, content=payload.content)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
