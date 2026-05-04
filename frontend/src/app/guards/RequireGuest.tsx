import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@app/hooks";

export function RequireGuest(): JSX.Element {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
