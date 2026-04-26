import { baseApi } from "@shared/api/baseApi";
import type { User } from "@shared/api/types";

type UpdateCurrentUserRequest = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCurrentUser: builder.query<User, void>({
      query: () => ({
        url: "/users/me"
      })
    }),
    updateCurrentUser: builder.mutation<User, UpdateCurrentUserRequest>({
      query: (body) => ({
        url: "/users/me",
        method: "PUT",
        body
      })
    })
  })
});

export const { useGetCurrentUserQuery, useUpdateCurrentUserMutation } = usersApi;
