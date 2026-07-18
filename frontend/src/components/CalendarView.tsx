import { useState } from "react";
import { Link } from "react-router-dom";
import type { ScheduleItem } from "../types";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

interface CalendarViewProps {
  items: ScheduleItem[];
}

const pad = (n: number) => String(n).padStart(2, "0");

const toDateStr = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`;

export default function CalendarView({ items }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const itemsByDate = new Map<string, ScheduleItem[]>();
  for (const item of items) {
    const list = itemsByDate.get(item.date) ?? [];
    list.push(item);
    itemsByDate.set(item.date, list);
  }

  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const goPrev = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="calendar">
      <div className="calendar__nav">
        <button type="button" onClick={goPrev} aria-label="이전 달">
          ‹
        </button>
        <span className="calendar__label">
          {year}년 {month + 1}월
        </span>
        <button type="button" onClick={goNext} aria-label="다음 달">
          ›
        </button>
        <button type="button" className="calendar__today" onClick={goToday}>
          오늘
        </button>
      </div>
      <div className="calendar__grid">
        {WEEKDAYS.map((w) => (
          <div key={w} className="calendar__weekday">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="calendar__cell calendar__cell--empty" />;
          const dateStr = toDateStr(year, month, day);
          const dayItems = itemsByDate.get(dateStr) ?? [];
          return (
            <div key={dateStr} className={`calendar__cell${dateStr === todayStr ? " calendar__cell--today" : ""}`}>
              <div className="calendar__date">{day}</div>
              <div className="calendar__items">
                {dayItems.map((item) =>
                  item.kind === "session" ? (
                    <Link
                      key={`session-${item.session.id}`}
                      to={`/sessions/${item.session.id}`}
                      className="calendar__chip calendar__chip--session"
                    >
                      {item.session.topic ?? "모집 중"}
                    </Link>
                  ) : (
                    <span
                      key={`event-${item.event.id}`}
                      className="calendar__chip calendar__chip--event"
                      data-type={item.event.type}
                    >
                      {item.event.title}
                    </span>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
