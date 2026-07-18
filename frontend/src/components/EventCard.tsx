import type { CalendarEvent } from "../types";

interface EventCardProps {
  event: CalendarEvent;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="schedule-card schedule-card--event" data-event-type={event.type}>
      <div className="schedule-card__date">{event.event_date}</div>
      <div className="schedule-card__topic">
        <span className="badge badge--event" data-type={event.type}>
          {event.type}
        </span>{" "}
        {event.title}
      </div>
      {event.description && <div className="schedule-card__status">{event.description}</div>}
    </div>
  );
}
