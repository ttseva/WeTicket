import { baseApi } from "@shared/api/baseApi";
import type { GroupJoinInfo, GroupSession, GroupSessionDetails } from "@shared/api/types";

type CreateGroupSessionRequest = {
  eventId: string;
  seatIds: string[];
  expiresInHours?: number;
};

type CreateGroupSessionResponse = {
  sessionId: string;
  inviteLink: string;
  expiresAt: string;
  totalSeats: number;
};

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createGroupSession: builder.mutation<CreateGroupSessionResponse, CreateGroupSessionRequest>({
      query: (body) => ({
        url: "/groups",
        method: "POST",
        body
      })
    }),
    getMyGroupSessions: builder.query<{ sessions: GroupSession[] }, void>({
      query: () => ({
        url: "/groups/my"
      })
    }),
    getGroupSession: builder.query<GroupSessionDetails, string>({
      query: (sessionId) => ({
        url: `/groups/${sessionId}`
      })
    }),
    joinGroupByInvite: builder.query<GroupJoinInfo, string>({
      query: (inviteLink) => ({
        url: `/groups/join/${inviteLink}`
      })
    })
  })
});

export const {
  useCreateGroupSessionMutation,
  useGetMyGroupSessionsQuery,
  useGetGroupSessionQuery,
  useJoinGroupByInviteQuery
} = groupsApi;
