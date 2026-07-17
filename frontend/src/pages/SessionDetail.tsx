import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import SessionTabs from "../components/SessionTabs";
import type { StudySession } from "../types";

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<StudySession | null>(null);

  useEffect(() => {
    client.get<StudySession>(`/sessions/${id}`).then(({ data }) => setSession(data));
  }, [id]);

  if (!session) return <p>불러오는 중...</p>;

  return (
    <section>
      <h1>{session.topic ?? "발표자 모집 중"}</h1>
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
