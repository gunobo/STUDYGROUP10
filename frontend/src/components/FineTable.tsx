import type { Fine } from "../types";

interface FineTableProps {
  fines: Fine[];
}

export default function FineTable({ fines }: FineTableProps) {
  return (
    <div className="table-wrap">
      <table className="fine-table">
        <thead>
          <tr>
            <th>사유</th>
            <th>금액</th>
            <th>면제여부</th>
            <th>날짜</th>
          </tr>
        </thead>
        <tbody>
          {fines.map((fine) => (
            <tr key={fine.id}>
              <td>{fine.reason}</td>
              <td>{fine.amount}원</td>
              <td>{fine.exempted ? "면제" : "-"}</td>
              <td>{fine.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
