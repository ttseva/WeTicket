import { Link, useNavigate, useParams } from "react-router-dom";
import { useJoinGroupByInviteQuery } from "@shared/api/groupsApi";
import { useCreateBookingMutation } from "@shared/api/bookingsApi";
import { useState } from "react";

export function GroupJoinPage(): JSX.Element {
  const { inviteLink } = useParams<{ inviteLink: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();
  const { data, isLoading, isError } = useJoinGroupByInviteQuery(inviteLink ?? "", {
    skip: !inviteLink
  });

  async function handleBookAssignedSeat(): Promise<void> {
    if (!data?.assignedSeat) {
      setMessage("Свободных мест в этой группе больше нет.");
      return;
    }

    try {
      const result = await createBooking({
        eventId: data.event.id,
        seatIds: [data.assignedSeat.seatId],
        groupSessionId: data.sessionId
      }).unwrap();

      navigate(`/bookings/${result.bookingId}`);
    } catch {
      setMessage("Не удалось создать бронь для выделенного места.");
    }
  }

  if (!inviteLink) {
    return <section className="card">Некорректная ссылка приглашения.</section>;
  }

  return (
    <section className="card">
      <h1>Присоединение к группе</h1>
      {isLoading && <p>Загрузка...</p>}
      {isError && <p>Не удалось загрузить данные по приглашению.</p>}

      {data && (
        <>
          <p>
            <strong>{data.event.title}</strong>
          </p>
          <p className="muted">
            Организатор: {data.organizer.name} · Истекает:{" "}
            {new Date(data.expiresAt).toLocaleString("ru-RU")}
          </p>
          <p>
            Закрепленное место:{" "}
            {data.assignedSeat
              ? `ряд ${data.assignedSeat.row}, место ${data.assignedSeat.number}, ${data.assignedSeat.price} ₽`
              : "нет свободных мест"}
          </p>
          <button
            onClick={handleBookAssignedSeat}
            disabled={!data.assignedSeat || isCreatingBooking}
            style={{ marginRight: 10 }}
          >
            {isCreatingBooking ? "Создаем бронь..." : "Оплатить закрепленное место"}
          </button>
        </>
      )}

      {message && <p className="muted">{message}</p>}
      <Link to="/groups/my">← К групповым сессиям</Link>
    </section>
  );
}
