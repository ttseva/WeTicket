import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: Number(__ENV.VUS || 2),
  duration: __ENV.DURATION || "1m",
};

const BASE_URL = "http://localhost:8080";
const TOKEN = __ENV.TOKEN;
const EMAIL = __ENV.EMAIL || "client@weticket.ru";
const PASSWORD = __ENV.PASSWORD || "Client12345!";

export function setup() {
  if (TOKEN) {
    return { token: TOKEN };
  }

  const loginRes = http.post(
    `${BASE_URL}/v1/auth/login`,
    JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(loginRes, { "login 200": (r) => r.status === 200 });

  return {
    token: loginRes.json("accessToken"),
  };
}

export default function (data) {
  try {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.token}`,
    };

    const eventsRes = http.get(`${BASE_URL}/v1/events`);
    check(eventsRes, { "events 200": (r) => r.status === 200 });

    if (eventsRes.status !== 200) {
      return;
    }

    const events = eventsRes.json("events");
    if (!events || events.length === 0) {
      return;
    }

    const eventId = events[Math.floor(Math.random() * events.length)].id;

    const seatsRes = http.get(`${BASE_URL}/v1/events/${eventId}/seats`);
    check(seatsRes, { "seats 200": (r) => r.status === 200 });

    if (seatsRes.status !== 200) {
      return;
    }

    const seats = seatsRes.json("seats") || [];
    const freeSeats = seats.filter((seat) => seat.status === "free");
    const freeSeat = freeSeats[Math.floor(Math.random() * freeSeats.length)];

    if (!freeSeat) {
      return;
    }

    const bookingRes = http.post(
      `${BASE_URL}/v1/bookings`,
      JSON.stringify({
        eventId,
        seatIds: [freeSeat.seatId],
      }),
      { headers }
    );

    check(bookingRes, {
      "booking 200 or conflict": (r) => r.status === 200 || r.status === 409,
    });

    if (bookingRes.status !== 200) {
      return;
    }

    const bookingId = bookingRes.json("bookingId");

    const payRes = http.post(
      `${BASE_URL}/v1/bookings/${bookingId}/pay`,
      JSON.stringify({ paymentMethod: "card" }),
      { headers }
    );

    check(payRes, {
      "payment 200": (r) => r.status === 200,
    });
  } finally {
    sleep(Number(__ENV.SLEEP || 1));
  }
}