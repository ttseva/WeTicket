import { Link, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/hooks";
import { useGetMeQuery, useLogoutMutation } from "@shared/api/authApi";
import { logout, setCurrentUser } from "@shared/store/authSlice";
import { useEffect } from "react";

const navItems = [
  { to: "/", label: "Каталог" },
  { to: "/profile", label: "Профиль" },
  { to: "/profile/tickets", label: "Мои билеты" },
  { to: "/profile/bookings", label: "Мои бронирования" },
  { to: "/groups/my", label: "Группы" },
  { to: "/admin", label: "Админ" },
  { to: "/tickets/validate", label: "Валидация билета" }
];

export function MainLayout(): JSX.Element {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [logoutRequest, { isLoading }] = useLogoutMutation();
  const { data: me, isError: meRequestFailed } = useGetMeQuery(undefined, {
    skip: !accessToken
  });

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
    <div>
      <header className="card" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0 }}>
        <div className="container" style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <Link to="/" style={{ fontWeight: 700 }}>
            WeTicket
          </Link>
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="muted">
              {item.label}
            </Link>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {user && (
              <span className="muted">
                {user.firstName} ({user.role})
              </span>
            )}
            {accessToken ? (
              <button onClick={handleLogout} disabled={isLoading}>
                {isLoading ? "Выходим..." : "Выйти"}
              </button>
            ) : (
              <Link to="/auth/login">Войти</Link>
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
