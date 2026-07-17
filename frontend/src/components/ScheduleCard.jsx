export default function ScheduleCard({ session }) {
  return (
    <div className="schedule-card">
      <div>{session.scheduled_date}</div>
      <div>{session.topic}</div>
      <div>{session.status}</div>
    </div>
  );
}
