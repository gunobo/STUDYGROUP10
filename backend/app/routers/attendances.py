from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.db.base import get_db
from app.deps import get_current_user, require_admin
from app.models.attendance import Attendance
from app.schemas.attendance import AttendanceCreate, AttendanceRead, AttendanceUpdate

sessions_router = APIRouter(prefix="/api/sessions", tags=["attendances"])
attendances_router = APIRouter(prefix="/api/attendances", tags=["attendances"])


@sessions_router.get("/{session_id}/attendances", response_model=list[AttendanceRead])
def list_session_attendances(
    session_id: int, db: DBSession = Depends(get_db), _=Depends(get_current_user)
):
    return db.query(Attendance).filter(Attendance.session_id == session_id).all()


@sessions_router.post(
    "/{session_id}/attendances", response_model=AttendanceRead, status_code=status.HTTP_201_CREATED
)
def create_attendance(
    session_id: int,
    payload: AttendanceCreate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    attendance = Attendance(session_id=session_id, user_id=payload.user_id, status=payload.status)
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


@attendances_router.patch("/{attendance_id}", response_model=AttendanceRead)
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: DBSession = Depends(get_db),
    _=Depends(require_admin),
):
    attendance = db.get(Attendance, attendance_id)
    if attendance is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "출석 기록을 찾을 수 없습니다")
    attendance.status = payload.status
    db.commit()
    db.refresh(attendance)
    return attendance
