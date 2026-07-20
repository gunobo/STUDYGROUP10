import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

DEFAULT_FINE_AMOUNT = 500


class FineReason(str, enum.Enum):
    no_show = "무단불참"
    unprepared = "자료미준비"
    late = "무단지각"
    same_day_cancel = "당일취소"
    homework_incomplete = "숙제안함"
    other = "기타"


class Fine(Base):
    __tablename__ = "fines"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    session_id: Mapped[int | None] = mapped_column(ForeignKey("sessions.id"), nullable=True)
    reason: Mapped[FineReason] = mapped_column(Enum(FineReason))
    amount: Mapped[int] = mapped_column(Integer, default=DEFAULT_FINE_AMOUNT)
    exempted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
