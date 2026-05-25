import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyBookingsQuery } from "@shared/api/bookingsApi";
import { downloadTicketPdf } from "@shared/api/ticketsApi";
import { useAppSelector } from "@app/hooks";
import { getTicketStatusText } from "@shared/utils/ticketStatus";

export function MyTicketsPage(): JSX.Element {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetMyBookingsQuery({ page: 1, limit: 20, status: "paid" });

  async function handleDownloadPdf(ticketId: string): Promise<void> {
    setPdfError(null);
    setDownloadingId(ticketId);
    try {
      await downloadTicketPdf(ticketId, accessToken);
    } catch {
      setPdfError("Не удалось сгенерировать PDF.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <section className="card">
      <h1>Мои билеты</h1>
      <p className="muted">Оплаченные билеты и скачивание PDF.</p>

      {isLoading && <p className="state-message">Загрузка...</p>}
      {isError && <p className="text-error">Не удалось загрузить билеты.</p>}
      {pdfError && <p className="text-error">{pdfError}</p>}

      {!!data && data.bookings.length === 0 && (
        <p className="muted">Оплаченных билетов пока нет.</p>
      )}

      {!!data && data.bookings.length > 0 && (
        <ul className="content-list">
          {data.bookings.map((booking) => (
            <li key={booking.id}>
              <strong>{booking.event.title}</strong>
              <div className="muted" style={{ marginTop: 4 }}>
                <span className={`status-badge status-badge--${booking.status}`}>
                  {getTicketStatusText(booking.status)}
                </span>
                {" · "}
                {booking.totalAmount.toLocaleString("ru-RU")} ₽
              </div>
              <div className="form-row" style={{ marginTop: 8, flexWrap: "wrap" }}>
                <Link to={`/bookings/${booking.id}`}>Открыть бронирование</Link>
                {(booking.tickets ?? []).map((ticket) => (
                  <button
                    key={ticket.ticketId}
                    type="button"
                    onClick={() => handleDownloadPdf(ticket.ticketId)}
                    disabled={downloadingId === ticket.ticketId}
                  >
                    {downloadingId === ticket.ticketId ? "Генерация..." : "Сгенерировать PDF"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
