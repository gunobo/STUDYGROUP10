import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import QuestionItem from "../components/QuestionItem";
import { useAuthStore } from "../store/useAuthStore";
import type { Question } from "../types";

export default function QuestionBoard() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [content, setContent] = useState("");

  const load = () => {
    client.get<Question[]>(`/sessions/${id}/questions`).then(({ data }) => setQuestions(data));
  };

  useEffect(load, [id]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await client.post(`/sessions/${id}/questions`, { content });
    setContent("");
    load();
  };

  return (
    <section>
      <h1>질문 게시판</h1>
      {user ? (
        <form className="question-form" onSubmit={submit}>
          <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="질문을 입력하세요" />
          <button type="submit">등록</button>
        </form>
      ) : (
        <p className="note">
          로그인 후 질문을 남길 수 있습니다. <a href="/api/auth/google/login">구글 계정으로 로그인</a>
        </p>
      )}
      <ul>
        {questions.map((q) => (
          <li key={q.id}>
            <QuestionItem question={q} />
          </li>
        ))}
      </ul>
    </section>
  );
}
