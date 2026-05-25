import { baseApi } from "@shared/api/baseApi";
import { env } from "@shared/config/env";
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

export async function downloadTicketPdf(ticketId: string, accessToken: string | null): Promise<void> {
  const response = await fetch(`${env.apiBaseUrl}/tickets/${ticketId}/pdf`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  });

  if (!response.ok) {
    throw new Error("PDF download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ticket-${ticketId}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
