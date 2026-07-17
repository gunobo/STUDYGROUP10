from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.fine import FineReason


class FineCreate(BaseModel):
    user_id: int
    session_id: int | None = None
    reason: FineReason
    exempted: bool = False


class FineUpdate(BaseModel):
    exempted: bool


class FineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    session_id: int | None
    reason: FineReason
    amount: int
    exempted: bool
    created_at: datetime


class FineSummaryItem(BaseModel):
    user_id: int
    name: str
    total_amount: int


class FineSummary(BaseModel):
    by_user: list[FineSummaryItem]
    total_amount: int
