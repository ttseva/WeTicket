import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@app/hooks";
import type { UserRole } from "@shared/api/types";

type RequireRoleProps = {
  allowedRoles: UserRole[];
};

export function RequireRole({ allowedRoles }: RequireRoleProps): JSX.Element {
  const userRole = useAppSelector((state) => state.auth.user?.role);

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
