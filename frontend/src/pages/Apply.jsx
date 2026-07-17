import { useState } from "react";
import client from "../api/client";

const initialForm = {
  student_id: "",
  name: "",
  phone: "",
  topics: ["", ""],
  available_time: "",
  privacy_consent: false,
  rules_agreed: "",
};

export default function Apply() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateTopic = (index) => (e) => {
    setForm((f) => {
      const topics = [...f.topics];
      topics[index] = e.target.value;
      return { ...f, topics };
    });
  };

  const addTopic = () => setForm((f) => ({ ...f, topics: [...f.topics, ""] }));

  const removeTopic = (index) =>
    setForm((f) => ({ ...f, topics: f.topics.filter((_, i) => i !== index) }));

  const validTopics = form.topics.map((t) => t.trim()).filter(Boolean);
  const canSubmit =
    form.student_id.trim() &&
    form.name.trim() &&
    form.phone.trim() &&
    validTopics.length >= 2 &&
    form.available_time.trim() &&
    form.privacy_consent &&
    form.rules_agreed === "예";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/applications", {
        student_id: form.student_id.trim(),
        name: form.name.trim(),
        phone: form.phone.replace(/-/g, "").trim(),
        topics: validTopics,
        available_time: form.available_time.trim(),
        privacy_consent: form.privacy_consent,
        rules_agreed: form.rules_agreed === "예",
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail ?? "신청 접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  if (submitted) {
    return (
      <section className="login-card">
        <h1>신청 완료</h1>
        <p>신청이 접수되었습니다. 검토 후 연락드리겠습니다.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>참가 신청</h1>
      <p>여름방학 회고 스터디에 참가를 원하시면 아래 정보를 남겨주세요.</p>
      <form onSubmit={submit}>
        <label>
          학번
          <input required value={form.student_id} onChange={update("student_id")} placeholder="예: 1111" />
        </label>
        <label>
          이름
          <input required value={form.name} onChange={update("name")} placeholder="예: 이수민" />
        </label>
        <label>
          전화번호 ('-' 제외)
          <input required value={form.phone} onChange={update("phone")} placeholder="01012345678" />
        </label>

        <div>
          <label>공부할 내용 혹은 분야 (2개 이상)</label>
          {form.topics.map((topic, i) => (
            <div key={i} className="topic-row">
              <input value={topic} onChange={updateTopic(i)} placeholder={`분야 ${i + 1} (예: 알고리즘)`} />
              {form.topics.length > 2 && (
                <button type="button" onClick={() => removeTopic(i)}>
                  삭제
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addTopic}>
            분야 추가
          </button>
        </div>

        <label>
          설명회 참여 가능 시간
          <input
            required
            value={form.available_time}
            onChange={update("available_time")}
            placeholder="예: 평일 저녁 7시 이후"
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.privacy_consent}
            onChange={(e) => setForm((f) => ({ ...f, privacy_consent: e.target.checked }))}
          />
          <span>
            [개인정보 수집 동의] 수집 항목: 학번, 이름, 전화번호 / 수집 목적: 참가자 선발 및 안내 /
            보유 기간: 스터디 종료 후 파기. 위 내용에 동의합니다.
          </span>
        </label>

        <div>
          <label>스터디 규칙을 확인했으며 성실하게 참여하겠습니다.</label>
          <div className="radio-row">
            <label>
              <input
                type="radio"
                name="rules_agreed"
                value="예"
                checked={form.rules_agreed === "예"}
                onChange={update("rules_agreed")}
              />
              예
            </label>
            <label>
              <input
                type="radio"
                name="rules_agreed"
                value="아니오"
                checked={form.rules_agreed === "아니오"}
                onChange={update("rules_agreed")}
              />
              아니오
            </label>
          </div>
          {form.rules_agreed === "아니오" && (
            <p className="apply__error">스터디 규칙에 동의해야 신청할 수 있습니다.</p>
          )}
        </div>

        {error && <p className="apply__error">{error}</p>}
        <button type="submit" disabled={!canSubmit}>
          신청하기
        </button>
      </form>
    </section>
  );
}
