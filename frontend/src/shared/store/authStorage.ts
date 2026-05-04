import type { User } from "@shared/api/types";

const ACCESS_TOKEN_KEY = "weticket.accessToken";
const REFRESH_TOKEN_KEY = "weticket.refreshToken";
const USER_KEY = "weticket.user";

type PersistedAuth = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadPersistedAuth(): PersistedAuth {
  if (!isBrowser()) {
    return { accessToken: null, refreshToken: null, user: null };
  }

  const accessToken = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  const userRaw = window.localStorage.getItem(USER_KEY);

  return {
    accessToken,
    refreshToken,
    user: userRaw ? (JSON.parse(userRaw) as User) : null
  };
}

export function persistAuth(data: PersistedAuth): void {
  if (!isBrowser()) {
    return;
  }

  if (data.accessToken) {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
  } else {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (data.refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  if (data.user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  } else {
    window.localStorage.removeItem(USER_KEY);
  }
}
