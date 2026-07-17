from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.attendance import AttendanceStatus


class AttendanceCreate(BaseModel):
    user_id: int
    status: AttendanceStatus


class AttendanceUpdate(BaseModel):
    status: AttendanceStatus


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    user_id: int
    status: AttendanceStatus
    checked_at: datetime
