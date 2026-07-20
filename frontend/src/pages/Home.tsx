import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import ScheduleCard from "../components/ScheduleCard";
import type { Question, StudySession } from "../types";

const FINE_RULES = [
  { situation: "발표 당일 무단 불참", amount: "500원" },
  { situation: "발표 자료 미준비", amount: "500원" },
  { situation: "무단 지각 (5분 이상)", amount: "500원" },
  { situation: "당일 취소(사유 없음)", amount: "500원" },
  { situation: "사전 연락 후 일정 조정", amount: "없음" },
  { situation: "갑작스러운 부상, 질병", amount: "없음" },
];

export default function Home() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [unresolvedQuestions, setUnresolvedQuestions] = useState<Question[]>([]);

  useEffect(() => {
    client.get<StudySession[]>("/sessions").then(({ data }) => setSessions(data));
    client
      .get<Question[]>("/questions/unresolved", { params: { limit: 5 } })
      .then(({ data }) => setUnresolvedQuestions(data));
  }, []);

  const nextSession = sessions.find((s) => s.status === "예정") ?? null;
  const sessionTopic = (sessionId: number) => sessions.find((s) => s.id === sessionId)?.topic ?? `세션 #${sessionId}`;

  return (
    <section>
      <h1>여름방학 회고 스터디</h1>
      <p>
        각자 하나의 분야를 맡아 일정 기간 동안 공부한 뒤, 디스코드에서 다른 사람들에게 발표하는
        스터디입니다. 혼자 공부하는 것에서 끝나는 게 아니라, 직접 설명하고 질문을 받으며
        이해도를 높이는 것이 목표입니다.
      </p>

      <h2>다음 발표</h2>
      {nextSession ? <ScheduleCard session={nextSession} /> : <p>예정된 발표가 없습니다.</p>}

      {unresolvedQuestions.length > 0 && (
        <>
          <h2>미해결 질문</h2>
          <p className="note">다음 발표 전까지 함께 조사해서 공유해야 하는 질문들입니다.</p>
          <ul>
            {unresolvedQuestions.map((q) => (
              <li key={q.id}>
                <Link to={`/sessions/${q.session_id}/questions`}>{sessionTopic(q.session_id)}</Link>
                <p>{q.content}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2>진행 방식</h2>
      <div className="flow-row">
        <span className="flow-row__step">일정 기간 공부</span>
        <span className="flow-row__arrow">→</span>
        <span className="flow-row__step">발표</span>
        <span className="flow-row__arrow">→</span>
        <span className="flow-row__step">피드백</span>
        <span className="flow-row__arrow">→</span>
        <span className="flow-row__step">반복</span>
      </div>
      <div>
        <ul className="plain-list">
          <li>각자 하나의 분야 담당 (예: 알고리즘, 리눅스, AI, 보안, 네트워크 등)</li>
          <li>발표는 하루에 최대 3명까지 진행</li>
          <li>
            발표 자료는 노션, PDF, PPT, 벨로그 등 공유 가능한 형태면 OK (다른 사람의 자료 불펌은
            NG!)
          </li>
        </ul>
        <p className="note">
          모든 사람이 같은 날 발표하는 것이 아니라 발표 날짜를 하루씩 나누어 진행합니다.
        </p>
      </div>
      <div>
        <h3>발표 구성</h3>
        <div className="chip-row">
          <span className="chip">개념</span>
          <span className="chip">실제 사용 예시</span>
          <span className="chip">시연 또는 실습</span>
          <span className="chip">Q&A</span>
          <span className="chip">간단한 퀴즈 및 정리</span>
        </div>
      </div>

      <h2>참가자 역할</h2>
      <div className="role-grid">
        <div className="role-card">
          <div className="role-card__title">발표자</div>
          <ul className="plain-list">
            <li>공부</li>
            <li>발표 준비</li>
            <li>발표 및 질의응답</li>
            <li>자료 공유</li>
          </ul>
        </div>
        <div className="role-card">
          <div className="role-card__title">청취자</div>
          <ul className="plain-list">
            <li>발표 듣기</li>
            <li>질문하기</li>
            <li>실습 참여</li>
            <li>피드백 작성</li>
          </ul>
        </div>
      </div>

      <h2>질문 문화</h2>
      <p>
        질문은 언제든 환영! 발표자가 바로 답하지 못해도 괜찮습니다. 대신 다음 발표 전까지 함께
        찾아보고 공유합니다.
      </p>
      <blockquote className="quote">모르는 건 괜찮지만, 그냥 넘어가지는 않습니다.</blockquote>

      <h2>목표</h2>
      <div>
        <ul className="plain-list">
          <li>담당 분야를 다른 사람에게 설명할 수 있을 정도로 이해하기</li>
          <li>다양한 분야의 기초 지식 얻기</li>
          <li>발표와 기술 문서 작성 경험 쌓기</li>
        </ul>
      </div>

      <h2>벌금</h2>
      <div className="table-wrap">
        <table className="fine-table">
          <thead>
            <tr>
              <th>상황</th>
              <th>벌금</th>
            </tr>
          </thead>
          <tbody>
            {FINE_RULES.map((rule) => (
              <tr key={rule.situation}>
                <td>{rule.situation}</td>
                <td>{rule.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        벌금은 모두 모아 회식비로 사용합니다. (벌금이 안 모이면 스터디장이 사줄듯)
      </p>

      <blockquote className="quote quote--closing">
        이 스터디는 잘 아는 사람이 가르치는 자리가 아니라, 함께 공부한 내용을 공유하며 같이
        성장하는 자리입니다!!
      </blockquote>
    </section>
  );
}
