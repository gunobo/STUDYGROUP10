import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import client from "../api/client";
import QuestionItem from "../components/QuestionItem";
import type { Question } from "../types";

export default function QuestionBoard() {
  const { id } = useParams<{ id: string }>();
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
      <form className="question-form" onSubmit={submit}>
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="질문을 입력하세요" />
        <button type="submit">등록</button>
      </form>
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
