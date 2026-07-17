import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AttendanceStatus(str, enum.Enum):
    present = "출석"
    late = "지각"
    absent = "불참"


class Attendance(Base):
    __tablename__ = "attendances"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[AttendanceStatus] = mapped_column(Enum(AttendanceStatus))
    checked_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
