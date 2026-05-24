import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetEventByIdQuery, useGetEventSeatsQuery } from "@shared/api/eventsApi";
import { useCreateBookingMutation } from "@shared/api/bookingsApi";
import { useCreateGroupSessionMutation } from "@shared/api/groupsApi";
import { useCancelEventMutation, useUpdateEventMutation } from "@shared/api/adminApi";
import { useAppSelector } from "@app/hooks";
import type { Event, Seat } from "@shared/api/types";
import {
  buildGroupInviteUrl,
  copyToClipboard,
  GROUP_SEAT_MAX,
  GROUP_SEAT_MIN
} from "@shared/utils/groupInvite";
import { toDatetimeLocalValue } from "@shared/utils/datetimeLocal";

type PurchaseMode = "individual" | "group";

const seatStatusColor: Record<Seat["status"], string> = {
  free: "#5c7a52",
  blocked: "#c4a574",
  group_blocked: "#9a8b7a",
  sold: "#b8aea0"
};

const selectableStatuses: Array<Seat["status"]> = ["free"];

function isStaffRole(role: string | undefined): boolean {
  return role === "organizer" || role === "admin";
}

export function EventDetailsPage(): JSX.Element {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const isStaff = isStaffRole(userRole);

  const [mode, setMode] = useState<PurchaseMode>("individual");
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [groupResult, setGroupResult] = useState<{ sessionId: string; inviteLink: string } | null>(
    null
  );
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [organizerMessage, setOrganizerMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    category: "concert" as Event["category"],
    dateTime: "",
    venue: "",
    address: ""
  });

  const [createBooking, { isLoading: isCreatingBooking }] = useCreateBookingMutation();
  const [createGroupSession, { isLoading: isCreatingGroup }] = useCreateGroupSessionMutation();
  const [updateEvent, { isLoading: isUpdatingEvent }] = useUpdateEventMutation();
  const [cancelEvent, { isLoading: isCancellingEvent }] = useCancelEventMutation();

  const {
    data: event,
    isLoading: eventLoading,
    isError: eventError,
    refetch: refetchEvent
  } = useGetEventByIdQuery(eventId ?? "", { skip: !eventId });
  const {
    data: seatsData,
    isLoading: seatsLoading,
    isError: seatsError,
    refetch: refetchSeats
  } = useGetEventSeatsQuery(eventId ?? "", { skip: !eventId });

  useEffect(() => {
    if (!event) {
      return;
    }
    setEditForm({
      title: event.title,
      description: event.description,
      category: event.category,
      dateTime: toDatetimeLocalValue(event.dateTime),
      venue: event.venue,
      address: event.address
    });
  }, [event]);

  const seatsByRows = useMemo(() => {
    const rows = new Map<number, Seat[]>();
    for (const seat of seatsData?.seats ?? []) {
      const existing = rows.get(seat.row) ?? [];
      existing.push(seat);
      rows.set(seat.row, existing);
    }
    return Array.from(rows.entries()).sort((a, b) => a[0] - b[0]);
  }, [seatsData?.seats]);

  function switchMode(nextMode: PurchaseMode): void {
    setMode(nextMode);
    setSelectedSeatIds([]);
    setGroupResult(null);
    setActionError(null);
    setCopyMessage(null);
  }

  function toggleSeat(seat: Seat): void {
    if (isStaff || !selectableStatuses.includes(seat.status)) {
      return;
    }
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.seatId)) {
        return prev.filter((id) => id !== seat.seatId);
      }
      if (mode === "individual") {
        return [seat.seatId];
      }
      if (prev.length >= GROUP_SEAT_MAX) {
        return prev;
      }
      return [...prev, seat.seatId];
    });
  }

  const selectedSeats = (seatsData?.seats ?? []).filter((seat) => selectedSeatIds.includes(seat.seatId));
  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const groupSelectionValid =
    selectedSeats.length >= GROUP_SEAT_MIN && selectedSeats.length <= GROUP_SEAT_MAX;
  const eventCancelled = event?.status === "cancelled";

  function requireAuth(): boolean {
    if (accessToken) {
      return true;
    }
    navigate("/auth/login", { state: { from: { pathname: `/events/${eventId}` } } });
    return false;
  }

  async function handleCreateBooking(): Promise<void> {
    if (!eventId || selectedSeatIds.length !== 1 || !requireAuth()) {
      return;
    }
    setActionError(null);

    try {
      const data = await createBooking({ eventId, seatIds: selectedSeatIds }).unwrap();
      navigate(`/bookings/${data.bookingId}`);
    } catch {
      setActionError("Не удалось создать бронирование. Возможно, место уже занято.");
    }
  }

  async function handleCreateGroup(): Promise<void> {
    if (!eventId || !groupSelectionValid || !requireAuth()) {
      return;
    }
    setActionError(null);
    setCopyMessage(null);

    try {
      const result = await createGroupSession({
        eventId,
        seatIds: selectedSeatIds
      }).unwrap();
      setGroupResult({ sessionId: result.sessionId, inviteLink: result.inviteLink });
    } catch {
      setActionError(
        `Не удалось создать групповую заявку. Выберите от ${GROUP_SEAT_MIN} до ${GROUP_SEAT_MAX} свободных мест.`
      );
    }
  }

  async function handleCopyInvite(): Promise<void> {
    if (!groupResult) {
      return;
    }
    const url = buildGroupInviteUrl(groupResult.inviteLink);
    const ok = await copyToClipboard(url);
    setCopyMessage(ok ? "Ссылка скопирована" : "Не удалось скопировать ссылку");
  }

  async function handleSaveEvent(formEvent: FormEvent<HTMLFormElement>): Promise<void> {
    formEvent.preventDefault();
    if (!eventId) {
      return;
    }
    setOrganizerMessage(null);
    try {
      await updateEvent({ eventId, body: editForm }).unwrap();
      setOrganizerMessage("Мероприятие обновлено.");
      setIsEditing(false);
      await refetchEvent();
    } catch {
      setOrganizerMessage("Не удалось сохранить изменения.");
    }
  }

  async function handleCancelEvent(): Promise<void> {
    if (!eventId || !window.confirm("Отменить мероприятие? Оплаченные билеты будут возвращены.")) {
      return;
    }
    setOrganizerMessage(null);
    try {
      const result = await cancelEvent(eventId).unwrap();
      setOrganizerMessage(
        `Мероприятие отменено. Затронуто бронирований: ${result.affectedBookings}.`
      );
      await Promise.all([refetchEvent(), refetchSeats()]);
    } catch {
      setOrganizerMessage("Не удалось отменить мероприятие.");
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
    <section className="page-stack">
      <Link to="/" className="muted card-link">
        ← Назад в каталог
      </Link>

      {eventLoading && <section className="card state-message">Загрузка карточки мероприятия...</section>}
      {eventError && <section className="card state-message">Не удалось загрузить мероприятие.</section>}
      {event && (
        <section className="card">
          <div className="form-row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1>{event.title}</h1>
              {eventCancelled && (
                <span className="status-badge status-badge--cancelled" style={{ marginTop: 8 }}>
                  Отменено
                </span>
              )}
            </div>
            {isStaff && !eventCancelled && (
              <div className="form-row">
                <button type="button" onClick={() => setIsEditing((value) => !value)}>
                  {isEditing ? "Закрыть" : "Редактировать"}
                </button>
                <button type="button" className="btn-danger" onClick={handleCancelEvent} disabled={isCancellingEvent}>
                  {isCancellingEvent ? "Отменяем..." : "Отменить"}
                </button>
              </div>
            )}
          </div>

          {isEditing && isStaff && (
            <form onSubmit={handleSaveEvent} className="form-grid" style={{ marginTop: 16, maxWidth: 720 }}>
              <input
                required
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                required
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, category: e.target.value as Event["category"] }))
                }
              >
                <option value="theatre">Театр</option>
                <option value="cinema">Кино</option>
                <option value="concert">Концерт</option>
                <option value="conference">Конференция</option>
              </select>
              <input
                required
                type="datetime-local"
                value={editForm.dateTime}
                onChange={(e) => setEditForm((prev) => ({ ...prev, dateTime: e.target.value }))}
              />
              <input
                required
                placeholder="Площадка"
                value={editForm.venue}
                onChange={(e) => setEditForm((prev) => ({ ...prev, venue: e.target.value }))}
              />
              <input
                required
                placeholder="Адрес"
                value={editForm.address}
                onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
              />
              <button type="submit" className="btn-primary" disabled={isUpdatingEvent} style={{ width: "fit-content" }}>
                {isUpdatingEvent ? "Сохраняем..." : "Сохранить"}
              </button>
            </form>
          )}

          {!isEditing && (
            <>
              <p className="muted">
                {new Date(event.dateTime).toLocaleString("ru-RU")} · {event.venue}
              </p>
              <p>{event.description}</p>
              <p className="muted">Категория: {event.category}</p>
            </>
          )}

          {organizerMessage && <p className="muted" style={{ marginTop: 12 }}>{organizerMessage}</p>}
        </section>
      )}

      {isStaff && (
        <section className="card">
          <p className="muted">
            Аккаунты организатора и администратора не могут бронировать места. Управляйте мероприятием через
            кнопки выше.
          </p>
        </section>
      )}

      {seatsLoading && <section className="card state-message">Загрузка схемы зала...</section>}
      {seatsError && <section className="card state-message">Не удалось загрузить места.</section>}
      {!!seatsData && !isStaff && !eventCancelled && (
        <section className="card">
          <div className="mode-toggle">
            <button
              type="button"
              className={mode === "individual" ? "mode-toggle__btn mode-toggle__btn--active" : "mode-toggle__btn"}
              onClick={() => switchMode("individual")}
            >
              Обычное бронирование
            </button>
            <button
              type="button"
              className={mode === "group" ? "mode-toggle__btn mode-toggle__btn--active" : "mode-toggle__btn"}
              onClick={() => switchMode("group")}
            >
              Купить компанией
            </button>
          </div>

          <h2>Схема зала</h2>
          <p className="muted seat-legend">
            {mode === "group"
              ? `Режим группы: выберите блок из ${GROUP_SEAT_MIN}–${GROUP_SEAT_MAX} мест`
              : "Выберите одно свободное место"}
          </p>

          <div>
            {seatsByRows.map(([row, seats]) => (
              <div key={row} className="seat-row">
                <strong className="seat-row__label">Ряд {row}</strong>
                {seats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.seatId);
                  const isClickable = selectableStatuses.includes(seat.status);
                  return (
                    <button
                      key={seat.seatId}
                      type="button"
                      className={`seat-btn${isSelected ? " seat-btn--selected" : ""}`}
                      onClick={() => toggleSeat(seat)}
                      disabled={!isClickable}
                      title={`Место ${seat.number}, ${seat.price} ₽, ${seat.status}`}
                      style={{ background: seatStatusColor[seat.status] }}
                    >
                      {seat.number}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="checkout-panel">
            <strong>Выбрано мест: {selectedSeats.length}</strong>
            {mode === "group" && (
              <p className="muted">
                Для группы нужно от {GROUP_SEAT_MIN} до {GROUP_SEAT_MAX} мест
              </p>
            )}
            <p className="muted">Сумма: {totalAmount.toLocaleString("ru-RU")} ₽</p>

            {actionError && <p className="text-error">{actionError}</p>}

            {mode === "individual" ? (
              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateBooking}
                disabled={selectedSeats.length !== 1 || isCreatingBooking}
              >
                {isCreatingBooking ? "Создаем бронь..." : "Забронировать место"}
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateGroup}
                disabled={!groupSelectionValid || isCreatingGroup}
              >
                {isCreatingGroup ? "Создаем группу..." : "Заблокировать блок и получить ссылку"}
              </button>
            )}
          </div>

          {groupResult && (
            <section className="invite-box">
              <h3>Ссылка-приглашение</h3>
              <p className="muted">Отправьте эту ссылку друзьям — каждый оплатит своё место из блока.</p>
              <input readOnly value={buildGroupInviteUrl(groupResult.inviteLink)} />
              <div className="form-row" style={{ marginTop: 10 }}>
                <button type="button" onClick={handleCopyInvite}>
                  Копировать ссылку
                </button>
                <Link to={`/groups/${groupResult.sessionId}`} className="link-button">
                  Отслеживать прогресс
                </Link>
              </div>
              {copyMessage && <p className="muted">{copyMessage}</p>}
            </section>
          )}
        </section>
      )}

      {!!seatsData && (isStaff || eventCancelled) && (
        <section className="card">
          <h2>Схема зала</h2>
          <p className="muted">Просмотр мест (бронирование недоступно).</p>
          <div>
            {seatsByRows.map(([row, seats]) => (
              <div key={row} className="seat-row">
                <strong className="seat-row__label">Ряд {row}</strong>
                {seats.map((seat) => (
                  <span
                    key={seat.seatId}
                    className="seat-btn seat-btn--readonly"
                    title={`Место ${seat.number}, ${seat.status}`}
                    style={{ background: seatStatusColor[seat.status] }}
                  >
                    {seat.number}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
