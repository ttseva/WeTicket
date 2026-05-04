import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@shared/api/types";
import { loadPersistedAuth, persistAuth } from "@shared/store/authStorage";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

const persistedAuth = loadPersistedAuth();

const initialState: AuthState = {
  accessToken: persistedAuth.accessToken,
  refreshToken: persistedAuth.refreshToken,
  user: persistedAuth.user
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string; user: User }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      persistAuth(state);
    },
    setAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      persistAuth(state);
    },
    setRefreshToken: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
      persistAuth(state);
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      persistAuth(state);
    },
    logout: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      persistAuth(state);
    }
  }
});

export const { setSession, setAccessToken, setRefreshToken, setCurrentUser, logout } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
