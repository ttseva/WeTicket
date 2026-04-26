import { Link, useSearchParams } from "react-router-dom";

export function PaymentResultPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "success";

  return (
    <section className="card">
      <h1>{isSuccess ? "Оплата прошла успешно" : "Ошибка оплаты"}</h1>
      <p className="muted">
        {isSuccess
          ? "Билеты выпущены. Вы можете перейти в раздел бронирований."
          : "Платеж не завершился. Попробуйте снова или выберите другой способ оплаты."}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <Link to="/profile/bookings">Мои бронирования</Link>
        <Link to="/">В каталог</Link>
      </div>
    </section>
  );
}
