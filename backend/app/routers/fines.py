from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import require_admin
from app.models.fine import DEFAULT_FINE_AMOUNT, Fine
from app.models.user import User
from app.schemas.fine import FineCreate, FineRead, FineSummary, FineSummaryItem, FineUpdate

router = APIRouter(prefix="/api/fines", tags=["fines"])


@router.get("", response_model=list[FineRead])
def list_fines(user_id: int | None = None, db: DBSession = Depends(get_db)):
    query = db.query(Fine)
    if user_id is not None:
        query = query.filter(Fine.user_id == user_id)
    return query.order_by(Fine.created_at.desc()).all()


@router.post("", response_model=FineRead, status_code=status.HTTP_201_CREATED)
def create_fine(payload: FineCreate, db: DBSession = Depends(get_db), _=Depends(require_admin)):
    fine = Fine(
        **payload.model_dump(),
        amount=0 if payload.exempted else DEFAULT_FINE_AMOUNT,
    )
    db.add(fine)
    db.commit()
    db.refresh(fine)
    return fine


@router.patch("/{fine_id}", response_model=FineRead)
def update_fine(
    fine_id: int, payload: FineUpdate, db: DBSession = Depends(get_db), _=Depends(require_admin)
):
    fine = db.get(Fine, fine_id)
    if fine is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "벌금 내역을 찾을 수 없습니다")
    fine.exempted = payload.exempted
    fine.amount = 0 if payload.exempted else DEFAULT_FINE_AMOUNT
    db.commit()
    db.refresh(fine)
    return fine


@router.get("/summary", response_model=FineSummary)
def fine_summary(db: DBSession = Depends(get_db)):
    fines = db.query(Fine).filter(Fine.exempted.is_(False)).all()
    totals: dict[int, int] = {}
    for fine in fines:
        totals[fine.user_id] = totals.get(fine.user_id, 0) + fine.amount

    by_user = []
    for user_id, total in totals.items():
        user = db.get(User, user_id)
        by_user.append(FineSummaryItem(user_id=user_id, name=user.name if user else "", total_amount=total))

    return FineSummary(by_user=by_user, total_amount=sum(totals.values()))
