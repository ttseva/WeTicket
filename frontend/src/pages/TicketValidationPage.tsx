import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useValidateTicketMutation } from "@shared/api/ticketsApi";

export function TicketValidationPage(): JSX.Element {
  const [qrCode, setQrCode] = useState("");
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [validateTicket, { data, isLoading, isError }] = useValidateTicketMutation();
  const navigate = useNavigate();

  async function handleValidate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!qrCode.trim()) return;
    await validateTicket({ qrCode: qrCode.trim() });
  }

  function handleOpenTicket(): void {
    if (!ticketIdInput.trim()) return;
    navigate(`/tickets/${ticketIdInput.trim()}`);
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <section className="card">
        <h1>Билеты и валидация</h1>
        <p className="muted">Проверка QR-кода и открытие конкретного билета по ID.</p>
      </section>

      <section className="card">
        <h2>Открыть билет по ticketId</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="ticketId"
            value={ticketIdInput}
            onChange={(event) => setTicketIdInput(event.target.value)}
          />
          <button onClick={handleOpenTicket}>Открыть</button>
        </div>
      </section>

      <section className="card">
        <h2>Валидация QR</h2>
        <form onSubmit={handleValidate} style={{ display: "flex", gap: 8 }}>
          <input
            value={qrCode}
            onChange={(event) => setQrCode(event.target.value)}
            placeholder="qrCode"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Проверяем..." : "Проверить"}
          </button>
        </form>
        {isError && <p>Не удалось проверить QR.</p>}
        {data && (
          <div style={{ marginTop: 10 }}>
            <p>
              Результат: <strong>{data.valid ? "VALID" : "INVALID"}</strong>
            </p>
            {data.valid && (
              <p className="muted">
                ticketId: {data.ticketId}, event: {data.event?.title}, seat: {data.seat}, used:{" "}
                {String(data.isUsed)}
              </p>
            )}
          </div>
        )}
      </section>

      <Link to="/profile/tickets">К моим билетам</Link>
    </section>
  );
}
