import { baseApi } from "@shared/api/baseApi";
import type { Event, Seat } from "@shared/api/types";

type EventsFilters = {
  category?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

type EventsListResponse = {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type EventSeatsResponse = {
  eventId: string;
  seats: Seat[];
};

function toQueryString(filters: EventsFilters): string {
  const params = new URLSearchParams();

  if (filters.category) params.set("category", filters.category);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

export const eventsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEvents: builder.query<EventsListResponse, EventsFilters>({
      query: (filters) => ({
        url: `/events${toQueryString(filters)}`
      })
    }),
    getEventById: builder.query<Event, string>({
      query: (eventId) => ({
        url: `/events/${eventId}`
      })
    }),
    getEventSeats: builder.query<EventSeatsResponse, string>({
      query: (eventId) => ({
        url: `/events/${eventId}/seats`
      })
    })
  })
});

export const { useGetEventsQuery, useGetEventByIdQuery, useGetEventSeatsQuery } = eventsApi;
