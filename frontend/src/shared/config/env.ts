const fallbackApiBaseUrl = "http://localhost:8080/v1";
const fallbackAppPort = 5174;

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl,
  appPort: Number(import.meta.env.VITE_APP_PORT ?? fallbackAppPort)
};
