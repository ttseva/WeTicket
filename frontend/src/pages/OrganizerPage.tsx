import { FormEvent, useState } from "react";
import { useCreateEventMutation, useGetStatisticsQuery, useUploadSeatsMutation } from "@shared/api/adminApi";

export function OrganizerPage(): JSX.Element {
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
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");
  const [message, setMessage] = useState<string | null>(null);

  const [createEvent, { isLoading: creatingEvent }] = useCreateEventMutation();
  const [uploadSeats, { isLoading: uploadingSeats }] = useUploadSeatsMutation();
  const { data: statistics, isLoading: statsLoading, isError: statsError, refetch } =
    useGetStatisticsQuery({ period });

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
        body: { rows: seatMapForm.rows, seatsPerRow: seatMapForm.seatsPerRow }
      }).unwrap();
      setMessage("Схема зала загружена.");
    } catch {
      setMessage("Не удалось загрузить схему зала.");
    }
  }

  return (
    <section className="page-stack">
      <section className="card">
        <h1>Панель организатора</h1>
        <p className="muted">
          Создание мероприятий и схем залов. Редактирование и отмена — в карточке мероприятия в каталоге.
        </p>
        {message && <p className="muted">{message}</p>}
      </section>

      <section className="card">
        <h2>Создать мероприятие</h2>
        <form onSubmit={handleCreateEvent} className="form-grid" style={{ maxWidth: 720 }}>
          <input
            required
            placeholder="Название"
            value={createEventForm.title}
            onChange={(e) => setCreateEventForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            required
            placeholder="Описание"
            value={createEventForm.description}
            onChange={(e) => setCreateEventForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <select
            value={createEventForm.category}
            onChange={(e) =>
              setCreateEventForm((prev) => ({
                ...prev,
                category: e.target.value as "theatre" | "cinema" | "concert" | "conference"
              }))
            }
          >
            <option value="theatre">Театр</option>
            <option value="cinema">Кино</option>
            <option value="concert">Концерт</option>
            <option value="conference">Конференция</option>
          </select>
          <input
            required
            type="datetime-local"
            value={createEventForm.dateTime}
            onChange={(e) => setCreateEventForm((prev) => ({ ...prev, dateTime: e.target.value }))}
          />
          <input
            required
            placeholder="Площадка"
            value={createEventForm.venue}
            onChange={(e) => setCreateEventForm((prev) => ({ ...prev, venue: e.target.value }))}
          />
          <input
            required
            placeholder="Адрес"
            value={createEventForm.address}
            onChange={(e) => setCreateEventForm((prev) => ({ ...prev, address: e.target.value }))}
          />
          <button type="submit" className="btn-primary" disabled={creatingEvent} style={{ width: "fit-content" }}>
            {creatingEvent ? "Создаем..." : "Создать"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Загрузить схему мест</h2>
        <form onSubmit={handleUploadSeats} className="form-grid" style={{ maxWidth: 420 }}>
          <input
            required
            placeholder="ID мероприятия"
            value={seatMapForm.eventId}
            onChange={(e) => setSeatMapForm((prev) => ({ ...prev, eventId: e.target.value }))}
          />
          <input
            required
            type="number"
            min={1}
            placeholder="Рядов"
            value={seatMapForm.rows}
            onChange={(e) => setSeatMapForm((prev) => ({ ...prev, rows: Number(e.target.value) }))}
          />
          <input
            required
            type="number"
            min={1}
            placeholder="Мест в ряду"
            value={seatMapForm.seatsPerRow}
            onChange={(e) => setSeatMapForm((prev) => ({ ...prev, seatsPerRow: Number(e.target.value) }))}
          />
          <button type="submit" disabled={uploadingSeats} style={{ width: "fit-content" }}>
            {uploadingSeats ? "Загружаем..." : "Загрузить"}
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Статистика</h2>
        <label>
          Период:{" "}
          <select value={period} onChange={(e) => setPeriod(e.target.value as "week" | "month" | "year")}>
            <option value="week">Неделя</option>
            <option value="month">Месяц</option>
            <option value="year">Год</option>
          </select>
        </label>
        {statsLoading && <p className="state-message">Загрузка...</p>}
        {statsError && <p className="text-error">Не удалось загрузить статистику.</p>}
        {statistics && (
          <div style={{ marginTop: 8 }}>
            <p className="muted">
              Бронирований: {statistics.summary.totalBookings}, оплачено: {statistics.summary.paidBookings},
              возвратов: {statistics.summary.refundedBookings}, выручка:{" "}
              {statistics.summary.revenue.toLocaleString("ru-RU")} ₽
            </p>
            <h4>Топ мероприятий</h4>
            <ul className="content-list">
              {statistics.topEvents.map((item) => (
                <li key={item.eventId}>
                  {item.title} — продано: {item.sold}, выручка: {item.revenue.toLocaleString("ru-RU")} ₽
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </section>
  );
}
