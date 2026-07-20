import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import client from "../api/client";
import ErrorMessage from "../components/ErrorMessage";
import Spinner from "../components/Spinner";
import { useAuthStore } from "../store/useAuthStore";
import type { StudySession } from "../types";

interface EditForm {
  material_url: string;
  concept_note: string;
  example_note: string;
  demo_note: string;
  summary_note: string;
  quiz_json: string;
}

const EMPTY_FORM: EditForm = {
  material_url: "",
  concept_note: "",
  example_note: "",
  demo_note: "",
  summary_note: "",
  quiz_json: "",
};

export default function SessionEdit() {
  const { id } = useParams<{ id: string }>();
  const currentUser = useAuthStore((state) => state.user);
  const [session, setSession] = useState<StudySession | null>(null);
  const [error, setError] = useState(false);
  const [form, setForm] = useState<EditForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  const load = () => {
    setError(false);
    client
      .get<StudySession>(`/sessions/${id}`)
      .then(({ data }) => {
        setSession(data);
        setForm({
          material_url: data.material_url ?? "",
          concept_note: data.concept_note ?? "",
          example_note: data.example_note ?? "",
          demo_note: data.demo_note ?? "",
          summary_note: data.summary_note ?? "",
          quiz_json: data.quiz_json ? JSON.stringify(data.quiz_json, null, 2) : "",
        });
      })
      .catch(() => setError(true));
  };

  useEffect(load, [id]);

  if (error) return <ErrorMessage message="세션 정보를 불러오지 못했습니다." onRetry={load} />;
  if (!session) return <Spinner />;

  const canEdit = currentUser?.role === "admin" || currentUser?.id === session.presenter_id;
  if (!canEdit) {
    return <ErrorMessage message="본인 발표만 자료를 작성할 수 있습니다." />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaveError("");
    setSaved(false);

    let quizPayload: unknown = null;
    if (form.quiz_json.trim()) {
      try {
        quizPayload = JSON.parse(form.quiz_json);
      } catch {
        setSaveError("퀴즈 JSON 형식이 올바르지 않습니다.");
        return;
      }
    }

    setSaving(true);
    try {
      await client.patch(`/sessions/${id}`, {
        material_url: form.material_url.trim() || null,
        concept_note: form.concept_note.trim() || null,
        example_note: form.example_note.trim() || null,
        demo_note: form.demo_note.trim() || null,
        summary_note: form.summary_note.trim() || null,
        quiz_json: quizPayload,
      });
      setSaved(true);
    } catch (err: any) {
      setSaveError(err.response?.data?.detail ?? "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h1>발표 자료 작성</h1>
      <p className="note">
        {session.scheduled_date} — {session.topic}
      </p>
      <form onSubmit={submit}>
        <label>
          발표 자료 링크 (노션/PDF/PPT/벨로그 등)
          <input
            value={form.material_url}
            onChange={(e) => setForm((f) => ({ ...f, material_url: e.target.value }))}
            placeholder="https://..."
          />
        </label>
        <label>
          개념
          <textarea
            value={form.concept_note}
            onChange={(e) => setForm((f) => ({ ...f, concept_note: e.target.value }))}
          />
        </label>
        <label>
          실제 사용 예시
          <textarea
            value={form.example_note}
            onChange={(e) => setForm((f) => ({ ...f, example_note: e.target.value }))}
          />
        </label>
        <label>
          시연/실습
          <textarea value={form.demo_note} onChange={(e) => setForm((f) => ({ ...f, demo_note: e.target.value }))} />
        </label>
        <label>
          정리
          <textarea
            value={form.summary_note}
            onChange={(e) => setForm((f) => ({ ...f, summary_note: e.target.value }))}
          />
        </label>
        <label>
          퀴즈 (JSON, 선택)
          <textarea
            value={form.quiz_json}
            onChange={(e) => setForm((f) => ({ ...f, quiz_json: e.target.value }))}
            placeholder='{"questions": [{"question": "...", "options": ["...", "..."], "answer": 0, "explanation": "선택"}]}'
          />
          <span className="note">answer는 정답 보기의 0부터 시작하는 인덱스(선택, 없으면 서술형으로 표시)</span>
        </label>
        {saveError && <p className="apply__error">{saveError}</p>}
        {saved && <p className="note">저장되었습니다.</p>}
        <button type="submit" disabled={saving}>
          {saving ? "저장 중..." : "저장"}
        </button>
      </form>
      <p>
        <Link to={`/sessions/${id}`}>세션 상세로 돌아가기</Link>
      </p>
    </section>
  );
}
