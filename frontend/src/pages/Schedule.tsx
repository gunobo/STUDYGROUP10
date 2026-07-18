import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import EventCard from "../components/EventCard";
import ScheduleCard from "../components/ScheduleCard";
import type { CalendarEvent, StudySession } from "../types";

type ScheduleItem =
  | { kind: "session"; date: string; session: StudySession }
  | { kind: "event"; date: string; event: CalendarEvent };

export default function Schedule() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    client.get<StudySession[]>("/sessions").then(({ data }) => setSessions(data));
    client.get<CalendarEvent[]>("/events").then(({ data }) => setEvents(data));
  }, []);

  const items: ScheduleItem[] = [
    ...sessions.map((session): ScheduleItem => ({ kind: "session", date: session.scheduled_date, session })),
    ...events.map((event): ScheduleItem => ({ kind: "event", date: event.event_date, event })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <section>
      <h1>일정표</h1>
      <ul>
        {items.map((item) =>
          item.kind === "session" ? (
            <li key={`session-${item.session.id}`}>
              <Link to={`/sessions/${item.session.id}`}>
                <ScheduleCard session={item.session} />
              </Link>
            </li>
          ) : (
            <li key={`event-${item.event.id}`}>
              <EventCard event={item.event} />
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
