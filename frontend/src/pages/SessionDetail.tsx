import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import ErrorMessage from "../components/ErrorMessage";
import SessionTabs from "../components/SessionTabs";
import Spinner from "../components/Spinner";
import type { StudySession } from "../types";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
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
      <SessionTabs session={session} />
    </section>
  );
}
