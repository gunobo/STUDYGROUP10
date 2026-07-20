"""add homework_incomplete fine reason

Revision ID: 44d5f842a78a
Revises: 37067d11f048
Create Date: 2026-07-20 03:27:22.301157

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44d5f842a78a'
down_revision: Union[str, Sequence[str], None] = '37067d11f048'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # MySQL enum 컬럼은 alembic autogenerate가 멤버 추가를 감지 못해 수동 작성
    op.execute(
        "ALTER TABLE fines MODIFY COLUMN reason "
        "ENUM('no_show','unprepared','late','same_day_cancel','homework_incomplete','other') NOT NULL"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        "ALTER TABLE fines MODIFY COLUMN reason "
        "ENUM('no_show','unprepared','late','same_day_cancel','other') NOT NULL"
    )
