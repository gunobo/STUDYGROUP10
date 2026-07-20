from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models.user import UserRole


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    profile_image_url: str | None
    role: UserRole
    created_at: datetime


class UserUpdate(BaseModel):
    role: UserRole


class ChecklistItem(BaseModel):
    user_id: int
    name: str
    email: str
    presentation_count: int
    latest_session_id: int | None
    latest_session_date: date | None
    content_complete: bool | None
    discord_id: str | None
    discord_joined: bool


class ChecklistUpdate(BaseModel):
    discord_joined: bool
