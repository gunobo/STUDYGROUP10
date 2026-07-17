import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client";

export default function Members() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    client.get("/users").then(({ data }) => setUsers(data));
  }, []);

  return (
    <section>
      <h1>참가자 목록</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <Link to={`/members/${user.id}`}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
