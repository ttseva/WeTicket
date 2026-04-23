jest.mock("../../../../src/modules/bookings/bookings.service", () => ({
  createBooking: jest.fn(),
  getBookingById: jest.fn(),
  cancelBooking: jest.fn(),
  payBooking: jest.fn(),
}));

const bookingsController = require("../../../../src/modules/bookings/bookings.controller");
const bookingsService = require("../../../../src/modules/bookings/bookings.service");

function createMockRes() {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

describe("bookings.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("payBooking returns 400 for unsupported payment method", async () => {
    const req = {
      auth: { userId: "user-1" },
      params: { bookingId: "booking-1" },
      body: { paymentMethod: "crypto" },
    };
    const res = createMockRes();
    const next = jest.fn();

    await bookingsController.payBooking(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(400);
    expect(err.message).toMatch(/unsupported payment method/i);
  });

  test("payBooking passes cardToken to service", async () => {
    const req = {
      auth: { userId: "user-1" },
      params: { bookingId: "booking-1" },
      body: { paymentMethod: "card", cardToken: "tok_123" },
    };
    const res = createMockRes();
    const next = jest.fn();

    bookingsService.payBooking.mockResolvedValue({
      bookingId: "booking-1",
      status: "paid",
      paidAt: new Date("2026-04-06T10:00:00.000Z"),
      tickets: [],
    });

    await bookingsController.payBooking(req, res, next);

    expect(bookingsService.payBooking).toHaveBeenCalledWith(
      "user-1",
      "booking-1",
      "card",
      "tok_123"
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});
