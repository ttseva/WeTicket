import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { env } from "@shared/config/env";
import type { RootState } from "@app/store";
import { logout, setAccessToken, setCurrentUser, setRefreshToken } from "@shared/store/authSlice";
import type { AuthRefreshResponse } from "@shared/api/types";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.accessToken;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  }
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  const state = api.getState() as RootState;
  const refreshToken = state.auth.refreshToken;

  if (!refreshToken) {
    api.dispatch(logout());
    return result;
  }

  const refreshResult = await rawBaseQuery(
    {
      url: "/auth/refresh",
      method: "POST",
      body: { refreshToken }
    },
    api,
    extraOptions
  );

  if (!refreshResult.data) {
    api.dispatch(logout());
    return result;
  }

  const refreshedData = refreshResult.data as AuthRefreshResponse;
  api.dispatch(setAccessToken(refreshedData.accessToken));

  if (refreshedData.refreshToken) {
    api.dispatch(setRefreshToken(refreshedData.refreshToken));
  }

  if (refreshedData.user) {
    api.dispatch(setCurrentUser(refreshedData.user));
  }

  result = await rawBaseQuery(args, api, extraOptions);
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({})
});
