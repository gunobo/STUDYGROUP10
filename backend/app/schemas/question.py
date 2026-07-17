from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuestionCreate(BaseModel):
    content: str


class QuestionUpdate(BaseModel):
    answered: bool | None = None
    resolved: bool | None = None
    answer_note: str | None = None
    resolved_before_session_id: int | None = None


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    author_id: int
    content: str
    answered: bool
    resolved: bool
    answer_note: str | None
    resolved_before_session_id: int | None
    created_at: datetime
