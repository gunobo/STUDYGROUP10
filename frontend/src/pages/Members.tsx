import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";
import ErrorMessage from "../components/ErrorMessage";
import Spinner from "../components/Spinner";
import type { User } from "../types";

export default function Members() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    client
      .get<User[]>("/users", { params: { approved_only: true } })
      .then(({ data }) => setUsers(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <section>
      <h1>참가자 목록</h1>
      {error ? (
        <ErrorMessage message="참가자 목록을 불러오지 못했습니다." onRetry={load} />
      ) : loading ? (
        <Spinner />
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              <Link to={`/members/${user.id}`}>{user.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
