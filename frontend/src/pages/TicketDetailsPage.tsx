import { Link, useParams } from "react-router-dom";
import { useGetTicketQuery } from "@shared/api/ticketsApi";

export function TicketDetailsPage(): JSX.Element {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data, isLoading, isError } = useGetTicketQuery(ticketId ?? "", {
    skip: !ticketId
  });

  if (!ticketId) {
    return <section className="card">Некорректный ticketId.</section>;
  }

  return (
    <section className="card">
      <h1>Билет</h1>
      {isLoading && <p>Загрузка...</p>}
      {isError && <p>Билет не найден или нет доступа.</p>}
      {data && (
        <>
          <p>
            <strong>{data.event.title}</strong>
          </p>
          <p className="muted">
            Место: ряд {data.seat.row}, место {data.seat.number} · Использован:{" "}
            {data.isUsed ? "да" : "нет"}
          </p>
          <p className="muted">QR: {data.qrCode}</p>
          <p className="muted">Выдан: {new Date(data.issuedAt).toLocaleString("ru-RU")}</p>
        </>
      )}
      <Link to="/profile/tickets">← К моим билетам</Link>
    </section>
  );
}
