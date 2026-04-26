import { baseApi } from "@shared/api/baseApi";

type CreateEventRequest = {
  title: string;
  description: string;
  category: "theatre" | "cinema" | "concert" | "conference";
  dateTime: string;
  duration?: number;
  venue: string;
  address: string;
  city?: string;
  minAge?: number;
  posterUrl?: string;
};

type UploadSeatsRequest = {
  rows: number;
  seatsPerRow: number;
  priceMap?: Record<string, number>;
  vipSeats?: string[];
};

type StatisticsResponse = {
  summary: {
    totalBookings: number;
    paidBookings: number;
    refundedBookings: number;
    revenue: number;
  };
  salesByCategory: Array<{ category: string; count: number; revenue: number }>;
  topEvents: Array<{ eventId: string; title: string; sold: number; revenue: number }>;
};

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createEvent: builder.mutation<
      { eventId: string; status: string; message: string },
      CreateEventRequest
    >({
      query: (body) => ({
        url: "/admin/events",
        method: "POST",
        body
      })
    }),
    uploadSeats: builder.mutation<{ message: string }, { eventId: string; body: UploadSeatsRequest }>({
      query: ({ eventId, body }) => ({
        url: `/admin/events/${eventId}/seats`,
        method: "POST",
        body
      })
    }),
    cancelEvent: builder.mutation<
      { message: string; affectedBookings: number; refundInitiated: boolean },
      string
    >({
      query: (eventId) => ({
        url: `/admin/events/${eventId}/cancel`,
        method: "POST"
      })
    }),
    getStatistics: builder.query<StatisticsResponse, { period?: "week" | "month" | "year"; eventId?: string }>({
      query: ({ period = "month", eventId }) => {
        const params = new URLSearchParams({ period });
        if (eventId) {
          params.set("eventId", eventId);
        }
        return { url: `/admin/statistics?${params.toString()}` };
      }
    })
  })
});

export const {
  useCreateEventMutation,
  useUploadSeatsMutation,
  useCancelEventMutation,
  useGetStatisticsQuery
} = adminApi;
