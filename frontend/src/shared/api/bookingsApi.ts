import { baseApi } from "@shared/api/baseApi";
import type {
  Booking,
  CreateBookingRequest,
  CreateBookingResponse,
  PayBookingRequest,
  PayBookingResponse
} from "@shared/api/types";

type CancelBookingResponse = {
  message: string;
};

export const bookingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createBooking: builder.mutation<CreateBookingResponse, CreateBookingRequest>({
      query: (body) => ({
        url: "/bookings",
        method: "POST",
        body
      })
    }),
    getBooking: builder.query<Booking, string>({
      query: (bookingId) => ({
        url: `/bookings/${bookingId}`
      })
    }),
    getMyBookings: builder.query<
      { bookings: Booking[]; pagination: { page: number; limit: number; total: number; totalPages: number } },
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 20, status }) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit)
        });
        if (status) {
          params.set("status", status);
        }
        return {
          url: `/users/me/bookings?${params.toString()}`
        };
      }
    }),
    payBooking: builder.mutation<PayBookingResponse, { bookingId: string; body: PayBookingRequest }>({
      query: ({ bookingId, body }) => ({
        url: `/bookings/${bookingId}/pay`,
        method: "POST",
        body
      })
    }),
    cancelBooking: builder.mutation<CancelBookingResponse, string>({
      query: (bookingId) => ({
        url: `/bookings/${bookingId}`,
        method: "DELETE"
      })
    })
  })
});

export const {
  useCreateBookingMutation,
  useGetBookingQuery,
  useGetMyBookingsQuery,
  usePayBookingMutation,
  useCancelBookingMutation
} = bookingsApi;
