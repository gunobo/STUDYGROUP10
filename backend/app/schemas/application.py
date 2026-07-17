from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.application import ApplicationStatus
from app.schemas.user import UserRead


class ApplicationCreate(BaseModel):
    student_id: str
    name: str
    phone: str
    topics: list[str]
    available_time: str
    privacy_consent: bool
    rules_agreed: bool

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str) -> str:
        return value.replace("-", "").strip()

    @field_validator("topics")
    @classmethod
    def validate_topics(cls, value: list[str]) -> list[str]:
        cleaned = [t.strip() for t in value if t.strip()]
        if len(cleaned) < 2:
            raise ValueError("공부할 내용/분야는 2개 이상 입력해야 합니다")
        return cleaned

    @field_validator("privacy_consent")
    @classmethod
    def validate_privacy_consent(cls, value: bool) -> bool:
        if not value:
            raise ValueError("개인정보 수집에 동의해야 신청할 수 있습니다")
        return value

    @field_validator("rules_agreed")
    @classmethod
    def validate_rules_agreed(cls, value: bool) -> bool:
        if not value:
            raise ValueError("스터디 규칙에 동의해야 신청할 수 있습니다")
        return value


class ApplicationWindow(BaseModel):
    opens_at: datetime | None
    closes_at: datetime | None
    is_open: bool


class ApplicationUpdate(BaseModel):
    status: ApplicationStatus
    # 승인(status="승인") 시 문자에 담을 설명회 일시/장소
    orientation_at: datetime | None = None
    orientation_place: str | None = None


class ApplicationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: UserRead
    student_id: str
    name: str
    phone: str
    topics: list[str]
    available_time: str
    status: ApplicationStatus
    orientation_at: datetime | None
    orientation_place: str | None
    sms_sent: bool
    created_at: datetime
