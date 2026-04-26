import { FormEvent, useState } from "react";
import {
  useCancelEventMutation,
  useCreateEventMutation,
  useGetStatisticsQuery,
  useUploadSeatsMutation
} from "@shared/api/adminApi";

export function AdminPage(): JSX.Element {
  const [createEventForm, setCreateEventForm] = useState({
    title: "",
    description: "",
    category: "concert" as "theatre" | "cinema" | "concert" | "conference",
    dateTime: "",
    venue: "",
    address: ""
  });
  const [seatMapForm, setSeatMapForm] = useState({
    eventId: "",
    rows: 10,
    seatsPerRow: 20
  });
  const [cancelEventId, setCancelEventId] = useState("");
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [message, setMessage] = useState<string | null>(null);

  const [createEvent, { isLoading: creatingEvent }] = useCreateEventMutation();
  const [uploadSeats, { isLoading: uploadingSeats }] = useUploadSeatsMutation();
  const [cancelEvent, { isLoading: cancellingEvent }] = useCancelEventMutation();
  const { data: statistics, isLoading: statsLoading, isError: statsError, refetch } = useGetStatisticsQuery({
    period
  });

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    try {
      const result = await createEvent(createEventForm).unwrap();
      setMessage(`Мероприятие создано: ${result.eventId}`);
      setSeatMapForm((prev) => ({ ...prev, eventId: result.eventId }));
      await refetch();
    } catch {
      setMessage("Не удалось создать мероприятие.");
    }
  }

  async function handleUploadSeats(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    try {
      await uploadSeats({
        eventId: seatMapForm.eventId,
        body: {
          rows: seatMapForm.rows,
          seatsPerRow: seatMapForm.seatsPerRow
        }
      }).unwrap();
      setMessage("Схема зала загружена.");
    } catch {
      setMessage("Не удалось загрузить схему зала.");
    }
  }

  async function handleCancelEvent(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    try {
      const result = await cancelEvent(cancelEventId).unwrap();
      setMessage(
        `Мероприятие отменено. Затронуто бронирований: ${result.affectedBookings}, refund: ${result.refundInitiated}`
      );
      await refetch();
    } catch {
      setMessage("Не удалось отменить мероприятие.");
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <section className="card">
        <h1>Админ-панель</h1>
        <p className="muted">Создание/отмена мероприятий, загрузка мест и статистика.</p>
        {message && <p className="muted">{message}</p>}
      </section>

      <section className="card">
        <h2>Создать мероприятие</h2>
        <form onSubmit={handleCreateEvent} style={{ display: "grid", gap: 8, maxWidth: 720 }}>
          <input
            required
            placeholder="Название"
            value={createEventForm.title}
            onChange={(event) => setCreateEventForm((prev) => ({ ...prev, title: event.target.value }))}
          />
          <textarea
            required
            placeholder="Описание"
            value={createEventForm.description}
            onChange={(event) =>
              setCreateEventForm((prev) => ({ ...prev, description: event.target.value }))
            }
          />
          <select
            value={createEventForm.category}
            onChange={(event) =>
              setCreateEventForm((prev) => ({
                ...prev,
                category: event.target.value as "theatre" | "cinema" | "concert" | "conference"
              }))
            }
          >
            <option value="theatre">theatre</option>
            <option value="cinema">cinema</option>
            <option value="concert">concert</option>
            <option value="conference">conference</option>
          </select>
          <input
            required
            type="datetime-local"
            value={createEventForm.dateTime}
            onChange={(event) => setCreateEventForm((prev) => ({ ...prev, dateTime: event.target.value }))}
          />
          <input
            required
            placeholder="Площадка"
            value={createEventForm.venue}
            onChange={(event) => setCreateEventForm((prev) => ({ ...prev, venue: event.target.value }))}
          />
          <input
            required
            placeholder="Адрес"
            value={createEventForm.address}
            onChange={(event) => setCreateEventForm((prev) => ({ ...prev, address: event.target.value }))}
          />
          <button type="submit" disabled={creatingEvent} style={{ width: "fit-content" }}>
            {creatingEvent ? "Создаем..." : "Создать"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Загрузить схему мест</h2>
        <form onSubmit={handleUploadSeats} style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <input
            required
            placeholder="Event ID"
            value={seatMapForm.eventId}
            onChange={(event) => setSeatMapForm((prev) => ({ ...prev, eventId: event.target.value }))}
          />
          <input
            required
            type="number"
            min={1}
            value={seatMapForm.rows}
            onChange={(event) => setSeatMapForm((prev) => ({ ...prev, rows: Number(event.target.value) }))}
          />
          <input
            required
            type="number"
            min={1}
            value={seatMapForm.seatsPerRow}
            onChange={(event) =>
              setSeatMapForm((prev) => ({ ...prev, seatsPerRow: Number(event.target.value) }))
            }
          />
          <button type="submit" disabled={uploadingSeats} style={{ width: "fit-content" }}>
            {uploadingSeats ? "Загружаем..." : "Загрузить"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Отменить мероприятие</h2>
        <form onSubmit={handleCancelEvent} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            required
            placeholder="Event ID"
            value={cancelEventId}
            onChange={(event) => setCancelEventId(event.target.value)}
          />
          <button type="submit" disabled={cancellingEvent}>
            {cancellingEvent ? "Отменяем..." : "Отменить"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Статистика</h2>
        <label>
          Период:{" "}
          <select value={period} onChange={(event) => setPeriod(event.target.value as "week" | "month" | "year")}>
            <option value="week">week</option>
            <option value="month">month</option>
            <option value="year">year</option>
          </select>
        </label>
        {statsLoading && <p>Загрузка...</p>}
        {statsError && <p>Не удалось загрузить статистику.</p>}
        {statistics && (
          <div style={{ marginTop: 8 }}>
            <p className="muted">
              Bookings: {statistics.summary.totalBookings}, paid: {statistics.summary.paidBookings},
              refunded: {statistics.summary.refundedBookings}, revenue:{" "}
              {statistics.summary.revenue.toLocaleString("ru-RU")} ₽
            </p>
            <h4>Top events</h4>
            <ul style={{ paddingLeft: 18 }}>
              {statistics.topEvents.map((item) => (
                <li key={item.eventId}>
                  {item.title} — sold: {item.sold}, revenue: {item.revenue.toLocaleString("ru-RU")} ₽
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </section>
  );
}
