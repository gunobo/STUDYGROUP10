import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CalendarEventType(str, enum.Enum):
    orientation = "설명회"
    notice = "공지"
    meeting = "회의"


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[CalendarEventType] = mapped_column(Enum(CalendarEventType))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[date] = mapped_column(Date)
    # 비워두면 설정된 발표 시작 시각(PRESENTATION_TIME)을 그대로 사용
    event_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    # 디스코드 서버 이벤트로 등록된 경우 그 id (삭제 시 정리하기 위해 보관)
    discord_event_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
