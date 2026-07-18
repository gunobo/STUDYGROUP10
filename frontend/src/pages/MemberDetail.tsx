import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import ErrorMessage from "../components/ErrorMessage";
import ScheduleCard from "../components/ScheduleCard";
import Spinner from "../components/Spinner";
import type { UserDetail } from "../types";

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    client
      .get<UserDetail>(`/users/${id}`)
      .then(({ data }) => setUser(data))
      .catch(() => setError(true));
  };

  useEffect(load, [id]);

  if (error) return <ErrorMessage message="참가자 정보를 불러오지 못했습니다." onRetry={load} />;
  if (!user) return <Spinner />;

  return (
    <section>
      <h1>{user.name}</h1>
      <p>
        <span className={`badge ${user.role === "admin" ? "badge--admin" : "badge--member"}`}>
          {user.role === "admin" ? "관리자" : "일반"}
        </span>
      </p>

      <h2>발표 이력</h2>
      {user.sessions.length === 0 ? (
        <p>아직 발표한 세션이 없습니다.</p>
      ) : (
        <ul>
          {user.sessions.map((session) => (
            <li key={session.id}>
              <ScheduleCard session={session} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
