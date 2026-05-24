import { Link, useNavigate, useParams } from "react-router-dom";
import { useJoinGroupByInviteQuery } from "@shared/api/groupsApi";
import { useCreateBookingMutation } from "@shared/api/bookingsApi";
import { useAppSelector } from "@app/hooks";
import { useState } from "react";

export function GroupJoinPage(): JSX.Element {
  const { inviteLink } = useParams<{ inviteLink: string }>();
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [message, setMessage] = useState<string | null>(null);
  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();
  const { data, isLoading, isError } = useJoinGroupByInviteQuery(inviteLink ?? "", {
    skip: !inviteLink
  });

  async function handlePaySeat(): Promise<void> {
    if (!data?.assignedSeat) {
      setMessage("Свободных мест в этой группе больше нет.");
      return;
    }

    if (!accessToken) {
      navigate("/auth/login", {
        state: { from: { pathname: `/groups/join/${inviteLink}` } }
      });
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
      setMessage("Не удалось забронировать место. Возможно, оно уже занято.");
    }
  }

  if (!inviteLink) {
    return <section className="card">Некорректная ссылка приглашения.</section>;
  }

  return (
    <section className="page-stack page-stack--narrow">
      <section className="card">
        <h1>Групповая покупка</h1>
        {isLoading && <p className="state-message">Загрузка...</p>}
        {isError && <p className="text-error">Ссылка недействительна или сессия истекла.</p>}

        {data && (
          <>
            <p>
              <strong>{data.event.title}</strong>
            </p>
            <p className="muted">
              {new Date(data.event.dateTime).toLocaleString("ru-RU")} · {data.event.venue}
            </p>
            <p className="muted">Организатор: {data.organizer.name}</p>
            <p className="muted">
              Сессия активна до {new Date(data.expiresAt).toLocaleString("ru-RU")}
            </p>

            {data.assignedSeat ? (
              <section className="assigned-seat-card">
                <h2>Ваше место</h2>
                <p>
                  Ряд <strong>{data.assignedSeat.row}</strong>, место{" "}
                  <strong>{data.assignedSeat.number}</strong>
                </p>
                <p className="assigned-seat-card__price">
                  {data.assignedSeat.price.toLocaleString("ru-RU")} ₽
                </p>
                <p className="muted">Можно оплатить только это закреплённое место.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handlePaySeat}
                  disabled={isCreatingBooking}
                >
                  {isCreatingBooking ? "Бронируем..." : "Перейти к оплате"}
                </button>
              </section>
            ) : (
              <p className="text-error">Все места в группе уже заняты или оплачены.</p>
            )}
          </>
        )}

        {message && <p className="text-error">{message}</p>}
      </section>

      <Link to="/" className="muted card-link">
        ← В каталог
      </Link>
    </section>
  );
}
