export type UserRole = "client" | "organizer" | "admin";
export type EventCategory = "theatre" | "cinema" | "concert" | "conference";
export type SeatStatus = "free" | "blocked" | "group_blocked" | "sold";
export type BookingStatus = "pending" | "paid" | "cancelled" | "expired" | "refunded";
export type GroupSessionStatus = "active" | "completed" | "expired";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
};

export type AuthLoginRequest = {
  email: string;
  password: string;
};

export type AuthRegisterRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

export type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
};

export type AuthRefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: User;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  dateTime: string;
  duration: number;
  venue: string;
  address: string;
  minAge?: number;
  posterUrl?: string;
  status: "draft" | "active" | "cancelled" | "completed";
};

export type Seat = {
  seatId: string;
  row: number;
  number: number;
  sector?: string;
  price: number;
  status: SeatStatus;
};

export type BookingTicketRef = {
  ticketId: string;
};

export type Booking = {
  id: string;
  event: Event;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  expiresAt: string;
  tickets?: BookingTicketRef[];
};

export type CreateBookingRequest = {
  eventId: string;
  seatIds: string[];
  groupSessionId?: string;
};

export type CreateBookingResponse = {
  bookingId: string;
  status: BookingStatus;
  expiresAt: string;
  totalAmount: number;
  paymentUrl: string;
};

export type PayBookingRequest = {
  paymentMethod: "card" | "wallet";
  cardToken?: string;
};

export type PayBookingResponse = {
  bookingId: string;
  status: "paid";
  paidAt: string;
  tickets: Array<{
    ticketId: string;
    seatId: string;
    qrCode: string;
  }>;
};

export type GroupSession = {
  sessionId: string;
  inviteLink: string;
  totalSeats: number;
  participantsCount: number;
  status: GroupSessionStatus;
  expiresAt: string;
  event?: {
    id: string;
    title: string;
  };
};

export type GroupSessionDetails = {
  sessionId: string;
  inviteLink: string;
  event: { id: string; title: string };
  status: GroupSessionStatus;
  totalSeats: number;
  participantsCount: number;
  participants: Array<{
    userId: string;
    name: string;
    paid: boolean;
    seatId: string | null;
    seatLabel: string | null;
  }>;
  expiresAt: string;
};

export type GroupJoinInfo = {
  sessionId: string;
  event: Event;
  assignedSeat: Seat | null;
  organizer: {
    userId: string;
    name: string;
  };
  expiresAt: string;
};
