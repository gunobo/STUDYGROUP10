import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import CalendarView from "../components/CalendarView";
import EventCard from "../components/EventCard";
import ScheduleCard from "../components/ScheduleCard";
import type { CalendarEvent, ScheduleItem, StudySession } from "../types";

export default function Schedule() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");

  useEffect(() => {
    client.get<StudySession[]>("/sessions").then(({ data }) => setSessions(data));
    client.get<CalendarEvent[]>("/events").then(({ data }) => setEvents(data));
  }, []);

  const items: ScheduleItem[] = useMemo(
    () =>
      [
        ...sessions.map((session): ScheduleItem => ({ kind: "session", date: session.scheduled_date, session })),
        ...events.map((event): ScheduleItem => ({ kind: "event", date: event.event_date, event })),
      ].sort((a, b) => a.date.localeCompare(b.date)),
    [sessions, events],
  );

  return (
    <section>
      <div className="schedule-header">
        <h1>일정표</h1>
        <div className="view-toggle">
          <button
            type="button"
            className={view === "list" ? "view-toggle__btn view-toggle__btn--active" : "view-toggle__btn"}
            onClick={() => setView("list")}
          >
            리스트
          </button>
          <button
            type="button"
            className={view === "calendar" ? "view-toggle__btn view-toggle__btn--active" : "view-toggle__btn"}
            onClick={() => setView("calendar")}
          >
            캘린더
          </button>
        </div>
      </div>

      {view === "list" ? (
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
      ) : (
        <CalendarView items={items} />
      )}
    </section>
  );
}
