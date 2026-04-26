import { baseApi } from "@shared/api/baseApi";
import type { Event, Seat } from "@shared/api/types";

type TicketDetails = {
  ticketId: string;
  event: Event;
  seat: Seat;
  qrCode: string;
  isUsed: boolean;
  issuedAt: string;
};

type TicketValidationResponse = {
  valid: boolean;
  ticketId?: string;
  event?: {
    id: string;
    title: string;
  };
  seat?: string;
  isUsed?: boolean;
};

export const ticketsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTicket: builder.query<TicketDetails, string>({
      query: (ticketId) => ({
        url: `/tickets/${ticketId}`
      })
    }),
    validateTicket: builder.mutation<TicketValidationResponse, { qrCode: string }>({
      query: (body) => ({
        url: "/tickets/validate",
        method: "POST",
        body
      })
    })
  })
});

export const { useGetTicketQuery, useValidateTicketMutation } = ticketsApi;
