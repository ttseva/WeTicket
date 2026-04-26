import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCancelBookingMutation,
  useGetBookingQuery,
  usePayBookingMutation
} from "@shared/api/bookingsApi";
import { formatRemainingTime } from "@shared/utils/bookingTime";

export function BookingCheckoutPage(): JSX.Element {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<"card" | "wallet">("card");
  const [cardToken, setCardToken] = useState("demo-card-token");
  const [tick, setTick] = useState(0);
  const [payBooking, { isLoading: isPaying }] = usePayBookingMutation();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();

  const { data: booking, isLoading, isError, refetch } = useGetBookingQuery(bookingId ?? "", {
    skip: !bookingId,
    pollingInterval: 5000
  });

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!bookingId) {
    return <section className="card">Некорректный идентификатор бронирования.</section>;
  }

  const remainingTime = booking?.status === "pending" ? formatRemainingTime(booking.expiresAt) : "--:--";

  async function handlePay(): Promise<void> {
    if (!booking) return;
    try {
      await payBooking({
        bookingId: booking.id,
        body: {
          paymentMethod,
          cardToken: paymentMethod === "card" ? cardToken : undefined
        }
      }).unwrap();
      navigate(`/bookings/${booking.id}/result?status=success`);
    } catch {
      navigate(`/bookings/${booking.id}/result?status=error`);
    }
  }

  async function handleCancel(): Promise<void> {
    if (!booking) return;
    try {
      await cancelBooking(booking.id).unwrap();
      await refetch();
    } catch {
      // keep minimal: request errors are already logged by middleware
    }
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <Link to="/" className="muted">
        ← В каталог
      </Link>

      {isLoading && <section className="card">Загрузка бронирования...</section>}
      {isError && <section className="card">Не удалось загрузить бронирование.</section>}

      {booking && (
        <>
          <section className="card">
            <h1>Бронирование</h1>
            <p className="muted">ID: {booking.id}</p>
            <p>
              <strong>{booking.event.title}</strong>
            </p>
            <p className="muted">
              {new Date(booking.event.dateTime).toLocaleString("ru-RU")} · {booking.event.venue}
            </p>
            <p>
              Статус: <strong>{booking.status}</strong>
            </p>
            <p>
              Сумма: <strong>{booking.totalAmount.toLocaleString("ru-RU")} ₽</strong>
            </p>
            <p>
              До истечения брони: <strong key={tick}>{remainingTime}</strong>
            </p>
          </section>

          {booking.status === "pending" && (
            <section className="card" style={{ display: "grid", gap: 12 }}>
              <h2 style={{ margin: 0 }}>Оплата</h2>
              <label>
                Способ оплаты
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as "card" | "wallet")}
                  style={{ marginLeft: 8 }}
                >
                  <option value="card">Карта</option>
                  <option value="wallet">Кошелек</option>
                </select>
              </label>
              {paymentMethod === "card" && (
                <label>
                  Card token
                  <input
                    value={cardToken}
                    onChange={(event) => setCardToken(event.target.value)}
                    style={{ marginLeft: 8 }}
                  />
                </label>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handlePay} disabled={isPaying}>
                  {isPaying ? "Оплачиваем..." : "Оплатить"}
                </button>
                <button onClick={handleCancel} disabled={isCancelling}>
                  {isCancelling ? "Отменяем..." : "Отменить бронь"}
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
