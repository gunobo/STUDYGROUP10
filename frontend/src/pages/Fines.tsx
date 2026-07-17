import { useEffect, useState } from "react";
import client from "../api/client";
import FineTable from "../components/FineTable";
import type { Fine, FineSummary } from "../types";

export default function Fines() {
  const [fines, setFines] = useState<Fine[]>([]);
  const [summary, setSummary] = useState<FineSummary | null>(null);

  useEffect(() => {
    client.get<Fine[]>("/fines").then(({ data }) => setFines(data));
    client.get<FineSummary>("/fines/summary").then(({ data }) => setSummary(data));
  }, []);

  return (
    <section>
      <h1>벌금 현황</h1>
      {summary && (
        <p className="fines-total">
          회식비 총액 <strong>{summary.total_amount.toLocaleString()}원</strong>
        </p>
      )}
      <FineTable fines={fines} />
    </section>
  );
}
