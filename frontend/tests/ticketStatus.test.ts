import { getTicketStatusText } from "@shared/utils/ticketStatus";

describe("getTicketStatusText", () => {
  it("maps pending status", () => {
    expect(getTicketStatusText("pending")).toBe("Ожидает оплаты");
  });

  it("maps refunded status", () => {
    expect(getTicketStatusText("refunded")).toBe("Возврат оформлен");
  });
});
