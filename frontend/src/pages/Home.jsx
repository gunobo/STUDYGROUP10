import { useEffect, useState } from "react";
import client from "../api/client";
import ScheduleCard from "../components/ScheduleCard";

export default function Home() {
  const [nextSession, setNextSession] = useState(null);

  useEffect(() => {
    client.get("/sessions", { params: { status_: "예정" } }).then(({ data }) => {
      setNextSession(data[0] ?? null);
    });
  }, []);

  return (
    <section>
      <h1>여름방학 회고 스터디</h1>
      <p>3일 공부 → 발표 → 피드백 사이클로 진행하는 스터디입니다.</p>
      <h2>다음 발표</h2>
      {nextSession ? <ScheduleCard session={nextSession} /> : <p>예정된 발표가 없습니다.</p>}
    </section>
  );
}
