import type { StudySession } from "../types";

interface ScheduleCardProps {
  session: StudySession;
}

export default function ScheduleCard({ session }: ScheduleCardProps) {
  return (
    <div className="schedule-card" data-status={session.status}>
      <div className="schedule-card__date">{session.scheduled_date}</div>
      <div className="schedule-card__topic">{session.topic}</div>
      <div className="schedule-card__status">{session.status}</div>
    </div>
  );
}
