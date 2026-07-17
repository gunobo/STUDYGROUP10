import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import ScheduleCard from "../components/ScheduleCard";

export default function Schedule() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    client.get("/sessions").then(({ data }) => setSessions(data));
  }, []);

  return (
    <section>
      <h1>일정표</h1>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            <Link to={`/sessions/${session.id}`}>
              <ScheduleCard session={session} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
