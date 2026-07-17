from datetime import datetime

from sqlalchemy import JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StudySettings(Base):
    __tablename__ = "study_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_opens_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    application_closes_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    orientation_options: Mapped[list] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
