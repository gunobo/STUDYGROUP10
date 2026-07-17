from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    motivation: str


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus
    # 승인(status="승인") 시 문자에 담을 설명회 일시/장소
    orientation_at: datetime | None = None
    orientation_place: str | None = None


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    phone: str | None
    motivation: str
    status: ApplicationStatus
    orientation_at: datetime | None
    orientation_place: str | None
    sms_sent: bool
    created_at: datetime
