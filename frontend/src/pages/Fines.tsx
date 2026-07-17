import { useEffect, useState } from "react";
import client from "../api/client";
import type { Fine, FineSummary, User } from "../types";

export default function Fines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [summary, setSummary] = useState<FineSummary | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    client.get<Fine[]>("/fines").then(({ data }) => setFines(data));
    client.get<FineSummary>("/fines/summary").then(({ data }) => setSummary(data));
    client.get<User[]>("/users").then(({ data }) => setUsers(data));
  }, []);

  const userName = (userId: number) => users.find((u) => u.id === userId)?.name ?? `참가자 #${userId}`;

  const groupedUserIds = Array.from(new Set(fines.map((f) => f.user_id)));

  return (
    <section>
      <h1>벌금 현황</h1>
      {summary && (
        <p className="fines-total">
          회식비 총액 <strong>{summary.total_amount.toLocaleString()}원</strong>
        </p>
      )}

      <h2>참가자별 내역</h2>
      {groupedUserIds.length === 0 ? (
        <p>기록된 벌금이 없습니다.</p>
      ) : (
        <ul>
          {groupedUserIds.map((userId) => {
            const userFines = fines.filter((f) => f.user_id === userId);
            const total = userFines.filter((f) => !f.exempted).reduce((sum, f) => sum + f.amount, 0);
            return (
              <li key={userId}>
                <strong>{userName(userId)}</strong> — {total.toLocaleString()}원
                <ul className="plain-list">
                  {userFines.map((f) => (
                    <li key={f.id}>
                      {f.reason} — {f.amount.toLocaleString()}원{" "}
                      {f.exempted && <span className="badge badge--approved">면제</span>}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
