import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import SessionTabs from "../components/SessionTabs";

export default function SessionDetail() {
  const { id } = useParams();
  const [session, setSession] = useState(null);

  useEffect(() => {
    client.get(`/sessions/${id}`).then(({ data }) => setSession(data));
  }, [id]);

  if (!session) return <p>불러오는 중...</p>;

  return (
    <section>
      <h1>{session.topic}</h1>
      <p>{session.scheduled_date}</p>
      {session.material_url && (
        <a href={session.material_url} target="_blank" rel="noreferrer">
          발표 자료 보기
        </a>
      )}
      <SessionTabs session={session} />
      <Link to={`/sessions/${id}/questions`}>질문 게시판 보기</Link>
    </section>
  );
}
