import enum
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SessionStatus(str, enum.Enum):
    scheduled = "예정"
    done = "완료"
    canceled = "취소"
    postponed = "연기"


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    # 관리자가 날짜만 열어두면(둘 다 NULL) 승인된 학생이 /claim으로 채움
    presenter_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    topic: Mapped[str | None] = mapped_column(String(200), nullable=True)
    scheduled_date: Mapped[date] = mapped_column(Date)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), default=SessionStatus.scheduled)
    material_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    concept_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    example_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    demo_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    quiz_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
