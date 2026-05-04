import type { BookingStatus } from "@shared/api/types";

const ticketStatusText: Record<BookingStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачен",
  refunded: "Возврат оформлен",
  cancelled: "Отменен",
  expired: "Истек"
};

export function getTicketStatusText(status: BookingStatus): string {
  return ticketStatusText[status];
}
