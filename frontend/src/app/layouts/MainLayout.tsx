import { Link, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { useGetMeQuery, useLogoutMutation } from "@shared/api/authApi";
import { logout, setCurrentUser } from "@shared/store/authSlice";
import type { UserRole } from "@shared/api/types";
import { useEffect, useMemo } from "react";

type NavItem = {
  to: string;
  label: string;
  roles?: UserRole[];
};

const allNavItems: NavItem[] = [
  { to: "/", label: "Каталог" },
  { to: "/profile", label: "Профиль" },
  { to: "/profile/tickets", label: "Мои билеты" },
  { to: "/profile/bookings", label: "Мои бронирования" },
  { to: "/groups/my", label: "Групповые покупки" },
  { to: "/organizer", label: "Организатор", roles: ["organizer", "admin"] },
  { to: "/tickets/validate", label: "Валидация билета", roles: ["organizer", "admin"] }
];

function roleLabel(role: UserRole): string {
  switch (role) {
    case "organizer":
      return "организатор";
    case "client":
      return "клиент";
    case "admin":
      return "система";
    default:
      return role;
  }
}

export function MainLayout(): JSX.Element {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [logoutRequest, { isLoading }] = useLogoutMutation();
  const { data: me, isError: meRequestFailed } = useGetMeQuery(undefined, {
    skip: !accessToken
  });

  const navItems = useMemo(
    () =>
      allNavItems.filter((item) => !item.roles || (user && item.roles.includes(user.role))),
    [user]
  );

  useEffect(() => {
    if (me) {
      dispatch(setCurrentUser(me));
    }
  }, [dispatch, me]);

  useEffect(() => {
    if (meRequestFailed && accessToken) {
      dispatch(logout());
    }
  }, [accessToken, dispatch, meRequestFailed]);

  async function handleLogout(): Promise<void> {
    try {
      await logoutRequest().unwrap();
    } catch {
      // Ignore remote logout failure and clear local session anyway.
    }
    dispatch(logout());
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" className="site-logo">
            WeTicket
          </Link>
          <nav className="site-nav">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="site-header__actions">
            {user && (
              <span className="user-badge">
                {user.firstName} · {roleLabel(user.role)}
              </span>
            )}
            {accessToken ? (
              <button type="button" className="btn-ghost" onClick={handleLogout} disabled={isLoading}>
                {isLoading ? "Выходим..." : "Выйти"}
              </button>
            ) : (
              <Link to="/auth/login" className="link-button">
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
