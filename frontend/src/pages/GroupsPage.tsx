import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useCreateGroupSessionMutation, useGetMyGroupSessionsQuery } from "@shared/api/groupsApi";

export function GroupsPage(): JSX.Element {
  const [eventId, setEventId] = useState("");
  const [seatIdsRaw, setSeatIdsRaw] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(48);
  const [message, setMessage] = useState<string | null>(null);
  const [createGroupSession, { isLoading: isCreating }] = useCreateGroupSessionMutation();
  const { data, isLoading, isError, refetch } = useGetMyGroupSessionsQuery();

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    const seatIds = seatIdsRaw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!eventId || seatIds.length === 0) {
      setMessage("Укажите eventId и минимум один seatId.");
      return;
    }

    try {
      const result = await createGroupSession({
        eventId,
        seatIds,
        expiresInHours
      }).unwrap();
      setMessage(`Сессия создана. Invite link: ${result.inviteLink}`);
      setSeatIdsRaw("");
      await refetch();
    } catch {
      setMessage("Не удалось создать групповую сессию.");
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <section className="card">
        <h1>Групповые покупки</h1>
        <p className="muted">UI лидера: создание сессии, ссылки и контроль прогресса участников.</p>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 10, maxWidth: 600 }}>
          <label>
            Event ID
            <input
              value={eventId}
              onChange={(event) => setEventId(event.target.value)}
              placeholder="uuid события"
              style={{ width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <label>
            Seat IDs (через запятую)
            <input
              value={seatIdsRaw}
              onChange={(event) => setSeatIdsRaw(event.target.value)}
              placeholder="seat-1, seat-2, seat-3"
              style={{ width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <label>
            Время жизни сессии (часы)
            <input
              type="number"
              min={1}
              value={expiresInHours}
              onChange={(event) => setExpiresInHours(Number(event.target.value))}
              style={{ width: 140, marginTop: 4, padding: 8 }}
            />
          </label>
          <button type="submit" disabled={isCreating} style={{ width: "fit-content" }}>
            {isCreating ? "Создаем..." : "Создать групповую сессию"}
          </button>
        </form>
        {message && <p className="muted">{message}</p>}
      </section>

      <section className="card">
        <h2>Мои групповые сессии</h2>
        {isLoading && <p>Загрузка...</p>}
        {isError && <p>Не удалось загрузить список сессий.</p>}
        {!!data && data.sessions.length === 0 && <p>Сессий пока нет.</p>}
        {!!data && data.sessions.length > 0 && (
          <ul style={{ display: "grid", gap: 12, paddingLeft: 18 }}>
            {data.sessions.map((session) => (
              <li key={session.sessionId}>
                <div>
                  <strong>{session.sessionId}</strong>
                </div>
                <div className="muted">
                  Прогресс: {session.participantsCount}/{session.totalSeats} · статус: {session.status}
                </div>
                <div className="muted">Invite link: {session.inviteLink}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to={`/groups/${session.sessionId}`}>Открыть прогресс</Link>
                  <Link to={`/groups/join/${session.inviteLink}`}>Страница участника</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
