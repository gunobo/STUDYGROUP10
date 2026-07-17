import enum
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ApplicationStatus(str, enum.Enum):
    pending = "대기"
    approved = "승인"
    rejected = "거절"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    student_id: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(50))
    topics: Mapped[list] = mapped_column(JSON)
    available_time: Mapped[str] = mapped_column(String(200))
    privacy_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    rules_agreed: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus), default=ApplicationStatus.pending)
    # 승인 시 안내할 설명회 일시/장소
    orientation_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    orientation_place: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User")
