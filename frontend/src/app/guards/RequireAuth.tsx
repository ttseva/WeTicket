import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@app/hooks";

export function RequireAuth(): JSX.Element {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
