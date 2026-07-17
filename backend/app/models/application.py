import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ApplicationStatus(str, enum.Enum):
    pending = "대기"
    approved = "승인"
    rejected = "거절"


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    motivation: Mapped[str] = mapped_column(Text)
    status: Mapped[ApplicationStatus] = mapped_column(Enum(ApplicationStatus), default=ApplicationStatus.pending)
    # 승인 시 안내할 설명회 일시/장소
    orientation_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    orientation_place: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
