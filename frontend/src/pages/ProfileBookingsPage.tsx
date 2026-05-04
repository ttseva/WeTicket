import { Link } from "react-router-dom";
import { useGetMyBookingsQuery } from "@shared/api/bookingsApi";
import { useState } from "react";

const statusOptions = [
  { value: "", label: "Все статусы" },
  { value: "pending", label: "pending" },
  { value: "paid", label: "paid" },
  { value: "cancelled", label: "cancelled" },
  { value: "expired", label: "expired" },
  { value: "refunded", label: "refunded" }
];

export function ProfileBookingsPage(): JSX.Element {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useGetMyBookingsQuery({ page, limit: 10, status: status || undefined });

  return (
    <section className="card">
      <h1>Мои бронирования</h1>
      <p className="muted">История бронирований пользователя.</p>
      <label>
        Фильтр по статусу:{" "}
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          {statusOptions.map((item) => (
            <option key={item.label} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {isLoading && <p>Загрузка...</p>}
      {isError && <p>Не удалось загрузить бронирования.</p>}

      {!!data && data.bookings.length === 0 && <p>Бронирований пока нет.</p>}

      {!!data && data.bookings.length > 0 && (
        <>
          <ul style={{ display: "grid", gap: 10, paddingLeft: 18 }}>
            {data.bookings.map((booking) => (
              <li key={booking.id}>
                <strong>{booking.event.title}</strong>{" "}
                <span className="muted">({booking.status})</span> —{" "}
                <Link to={`/bookings/${booking.id}`}>Открыть</Link>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Назад
            </button>
            <span className="muted">
              Страница {data.pagination.page} из {data.pagination.totalPages || 1}
            </span>
            <button
              disabled={data.pagination.page >= data.pagination.totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Вперед
            </button>
          </div>
        </>
      )}
    </section>
  );
}
