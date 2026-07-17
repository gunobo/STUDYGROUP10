import { useState } from "react";
import client from "../api/client";

const initialForm = { name: "", email: "", phone: "", motivation: "" };

export default function Apply() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await client.post("/applications", form);
      setSubmitted(true);
    } catch {
      setError("신청 접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
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
          이름
          <input required value={form.name} onChange={update("name")} />
        </label>
        <label>
          이메일
          <input required type="email" value={form.email} onChange={update("email")} />
        </label>
        <label>
          연락처
          <input value={form.phone} onChange={update("phone")} placeholder="선택 사항" />
        </label>
        <label>
          지원 동기
          <textarea required value={form.motivation} onChange={update("motivation")} rows={5} />
        </label>
        {error && <p className="apply__error">{error}</p>}
        <button type="submit">신청하기</button>
      </form>
    </section>
  );
}
