import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";

export const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const errorPayload = JSON.stringify(action.payload);
    console.error("HTTP request failed:", errorPayload);
  }

  return next(action);
};
