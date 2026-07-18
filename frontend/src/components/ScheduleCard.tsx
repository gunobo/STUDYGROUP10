import type { StudySession } from "../types";

interface ScheduleCardProps {
  session: StudySession;
}

export default function ScheduleCard({ session }: ScheduleCardProps) {
  return (
    <div className="schedule-card" data-status={session.status}>
      <div className="schedule-card__date">{session.scheduled_date}</div>
      <div className="schedule-card__topic">
        {session.topic ? (
          <>
            {session.topic}
            {session.claim_status === "대기" && <span className="badge badge--pending">승인 대기</span>}
          </>
        ) : (
          <span className="schedule-card__open">발표자 모집 중</span>
        )}
      </div>
      <div className="schedule-card__status">{session.status}</div>
    </div>
  );
}
