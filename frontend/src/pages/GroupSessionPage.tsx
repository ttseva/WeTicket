import { Link, useParams } from "react-router-dom";
import { useGetGroupSessionQuery } from "@shared/api/groupsApi";

export function GroupSessionPage(): JSX.Element {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data, isLoading, isError } = useGetGroupSessionQuery(sessionId ?? "", {
    skip: !sessionId,
    pollingInterval: 5000
  });

  if (!sessionId) {
    return <section className="card">Некорректный идентификатор сессии.</section>;
  }

  return (
    <section className="card">
      <h1>Групповая сессия</h1>
      {isLoading && <p>Загрузка...</p>}
      {isError && <p>Не удалось загрузить детали сессии.</p>}

      {data && (
        <>
          <p className="muted">
            Статус: {data.status} · прогресс: {data.participantsCount}/{data.totalSeats}
          </p>
          <p className="muted">Истекает: {new Date(data.expiresAt).toLocaleString("ru-RU")}</p>
          <h3>Участники</h3>
          <ul style={{ display: "grid", gap: 8, paddingLeft: 18 }}>
            {data.participants.map((participant) => (
              <li key={`${participant.userId}-${participant.seatId}`}>
                {participant.name} · seat: {participant.seatId ?? "-"} ·{" "}
                <strong>{participant.paid ? "paid" : "pending"}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link to="/groups/my">← К моим групповым сессиям</Link>
    </section>
  );
}
