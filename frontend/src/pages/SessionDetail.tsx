import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import ErrorMessage from "../components/ErrorMessage";
import SessionTabs from "../components/SessionTabs";
import Spinner from "../components/Spinner";
import { useAuthStore } from "../store/useAuthStore";
import type { StudySession } from "../types";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const [session, setSession] = useState<StudySession | null>(null);
  const [error, setError] = useState(false);

  const load = () => {
    setError(false);
    client
      .get<StudySession>(`/sessions/${id}`)
      .then(({ data }) => setSession(data))
      .catch(() => setError(true));
  };

  useEffect(load, [id]);

  if (error) return <ErrorMessage message="세션 정보를 불러오지 못했습니다." onRetry={load} />;
  if (!session) return <Spinner />;

  return (
    <section>
      <h1>
        {session.topic ?? "발표자 모집 중"}
        {session.claim_status === "대기" && <span className="badge badge--pending">승인 대기</span>}
      </h1>
      <p>{session.scheduled_date}</p>
      {session.material_url && (
        <a href={session.material_url} target="_blank" rel="noreferrer">
          발표 자료 보기
        </a>
      )}
      {(currentUser?.role === "admin" || currentUser?.id === session.presenter_id) && (
        <p>
          <Link to={`/sessions/${session.id}/edit`}>발표 자료 작성/수정</Link>
        </p>
      )}
      <SessionTabs session={session} />
    </section>
  );
}
