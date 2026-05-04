import { Link } from "react-router-dom";
import { useGetMyBookingsQuery } from "@shared/api/bookingsApi";
import { getTicketStatusText } from "@shared/utils/ticketStatus";

export function MyTicketsPage(): JSX.Element {
  const { data, isLoading, isError } = useGetMyBookingsQuery({ page: 1, limit: 20 });

  return (
    <section className="card">
      <h1>Мои билеты</h1>
      <p className="muted">Билеты и их текущие статусы.</p>

      {isLoading && <p>Загрузка...</p>}
      {isError && <p>Не удалось загрузить билеты.</p>}

      {!!data && data.bookings.length === 0 && <p>Билетов пока нет.</p>}

      {!!data && data.bookings.length > 0 && (
        <ul style={{ display: "grid", gap: 12, paddingLeft: 18 }}>
          {data.bookings.map((booking) => (
            <li key={booking.id}>
              <strong>{booking.event.title}</strong>
              <div className="muted">
                Статус: {getTicketStatusText(booking.status)} · Сумма:{" "}
                {booking.totalAmount.toLocaleString("ru-RU")} ₽
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Link to={`/bookings/${booking.id}`}>Открыть бронирование</Link>
                <Link to="/tickets/validate">Проверка/поиск билета</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
