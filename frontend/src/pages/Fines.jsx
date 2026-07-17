import { useEffect, useState } from "react";
import client from "../api/client";
import FineTable from "../components/FineTable";

export default function Fines() {
  const [fines, setFines] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    client.get("/fines").then(({ data }) => setFines(data));
    client.get("/fines/summary").then(({ data }) => setSummary(data));
  }, []);

  return (
    <section>
      <h1>벌금 현황</h1>
      {summary && <p>회식비 총액: {summary.total_amount}원</p>}
      <FineTable fines={fines} />
    </section>
  );
}
