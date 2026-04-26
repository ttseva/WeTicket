import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetEventByIdQuery, useGetEventSeatsQuery } from "@shared/api/eventsApi";
import { useCreateBookingMutation } from "@shared/api/bookingsApi";
import { useAppSelector } from "@app/hooks";
import type { Seat } from "@shared/api/types";

const seatStatusColor: Record<Seat["status"], string> = {
  free: "#22c55e",
  blocked: "#f59e0b",
  group_blocked: "#a855f7",
  sold: "#94a3b8"
};

const selectableStatuses: Array<Seat["status"]> = ["free"];

export function EventDetailsPage(): JSX.Element {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();

  const { data: event, isLoading: eventLoading, isError: eventError } = useGetEventByIdQuery(
    eventId ?? "",
    { skip: !eventId }
  );
  const { data: seatsData, isLoading: seatsLoading, isError: seatsError } = useGetEventSeatsQuery(
    eventId ?? "",
    { skip: !eventId }
  );

  const seatsByRows = useMemo(() => {
    const rows = new Map<number, Seat[]>();
    for (const seat of seatsData?.seats ?? []) {
      const existing = rows.get(seat.row) ?? [];
      existing.push(seat);
      rows.set(seat.row, existing);
    }
    return Array.from(rows.entries()).sort((a, b) => a[0] - b[0]);
  }, [seatsData?.seats]);

  function toggleSeat(seat: Seat): void {
    if (!selectableStatuses.includes(seat.status)) {
      return;
    }
    setSelectedSeatIds((prev) =>
      prev.includes(seat.seatId) ? prev.filter((id) => id !== seat.seatId) : [...prev, seat.seatId]
    );
  }

  const selectedSeats = (seatsData?.seats ?? []).filter((seat) => selectedSeatIds.includes(seat.seatId));
  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  async function handleCreateBooking(): Promise<void> {
    if (!eventId || selectedSeatIds.length === 0) {
      return;
    }

    if (!accessToken) {
      navigate("/auth/login", { state: { from: { pathname: `/events/${eventId}` } } });
      return;
    }

    try {
      const data = await createBooking({ eventId, seatIds: selectedSeatIds }).unwrap();
      navigate(`/bookings/${data.bookingId}`);
    } catch {
      // Keep flow simple: errors are logged in middleware and reflected by unavailable seats on reload.
    }
  }

  if (!eventId) {
    return (
      <section className="card">
        <p>Некорректный идентификатор мероприятия.</p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <Link to="/" className="muted">
        ← Назад в каталог
      </Link>

      {eventLoading && <section className="card">Загрузка карточки мероприятия...</section>}
      {eventError && <section className="card">Не удалось загрузить мероприятие.</section>}
      {event && (
        <section className="card">
          <h1>{event.title}</h1>
          <p className="muted">
            {new Date(event.dateTime).toLocaleString("ru-RU")} · {event.venue}
          </p>
          <p>{event.description}</p>
          <p className="muted">Категория: {event.category}</p>
        </section>
      )}

      {seatsLoading && <section className="card">Загрузка схемы зала...</section>}
      {seatsError && <section className="card">Не удалось загрузить места.</section>}
      {!!seatsData && (
        <section className="card">
          <h2>Схема зала</h2>
          <p className="muted">
            Статусы: free (зеленый), blocked (желтый), group_blocked (фиолетовый), sold (серый)
          </p>

          <div style={{ display: "grid", gap: 8 }}>
            {seatsByRows.map(([row, seats]) => (
              <div key={row} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <strong style={{ width: 56 }}>Ряд {row}</strong>
                {seats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.seatId);
                  const isClickable = selectableStatuses.includes(seat.status);
                  return (
                    <button
                      key={seat.seatId}
                      onClick={() => toggleSeat(seat)}
                      disabled={!isClickable}
                      title={`Место ${seat.number}, ${seat.price} ₽, ${seat.status}`}
                      style={{
                        border: isSelected ? "2px solid #0f172a" : "1px solid #cbd5e1",
                        background: seatStatusColor[seat.status],
                        color: "#ffffff",
                        minWidth: 40,
                        padding: "6px 8px",
                        borderRadius: 8,
                        cursor: isClickable ? "pointer" : "not-allowed",
                        opacity: isClickable ? 1 : 0.75
                      }}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <strong>Выбрано мест: {selectedSeats.length}</strong>
            <p className="muted" style={{ marginTop: 6 }}>
              Сумма: {totalAmount.toLocaleString("ru-RU")} ₽
            </p>
            <button
              onClick={handleCreateBooking}
              disabled={selectedSeats.length === 0 || isCreatingBooking}
            >
              {isCreatingBooking ? "Создаем бронь..." : "Забронировать выбранные места"}
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
