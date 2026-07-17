from datetime import datetime

from sqlalchemy import JSON, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class StudySettings(Base):
    __tablename__ = "study_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    application_opens_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    application_closes_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    orientation_options: Mapped[list] = mapped_column(JSON, default=list)
    # 디스코드 이벤트 등록에 쓰이는 값들 (비어있으면 .env 값으로 폴백, 봇 토큰은 비밀값이라 여기 없음)
    discord_guild_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    discord_voice_channel_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    presentation_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    presentation_duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
