import { baseApi } from "@shared/api/baseApi";
import type {
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRegisterRequest,
  User
} from "@shared/api/types";

type RegisterResponse = {
  userId: string;
  message: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, AuthRegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body
      })
    }),
    login: builder.mutation<AuthLoginResponse, AuthLoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body
      })
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST"
      })
    }),
    getMe: builder.query<User, void>({
      query: () => ({
        url: "/users/me",
        method: "GET"
      })
    })
  })
});

export const { useRegisterMutation, useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi;
