from datetime import datetime

from pydantic import BaseModel, ConfigDict


class FeedbackCreate(BaseModel):
    content: str


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    author_id: int
    content: str
    created_at: datetime
