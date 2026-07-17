import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuthStore } from "../store/useAuthStore";
import type { StudySession, UserDetail } from "../types";

export default function MyPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    if (!user) return;
    client.get<UserDetail>(`/users/${user.id}`).then(({ data }) => setSessions(data.sessions));
  }, [user]);

  return (
    <section>
      <h1>마이페이지</h1>
      <p>{user?.name}</p>
      <h2>내 발표 일정</h2>
      <ul>
        {sessions.map((session) => (
          <li key={session.id}>
            {session.scheduled_date} — {session.topic}
          </li>
        ))}
      </ul>
    </section>
  );
}
