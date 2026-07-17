export default function ScheduleCard({ session }) {
  return (
    <div className="schedule-card" data-status={session.status}>
      <div className="schedule-card__date">{session.scheduled_date}</div>
      <div className="schedule-card__topic">{session.topic}</div>
      <div className="schedule-card__status">{session.status}</div>
    </div>
  );
}
