import { FormEvent, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "@app/hooks";
import { useLoginMutation } from "@shared/api/authApi";
import { setSession } from "@shared/store/authSlice";

type LoginFormState = {
  email: string;
  password: string;
};

export function LoginPage(): JSX.Element {
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    try {
      const data = await login(form).unwrap();
      dispatch(
        setSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user
        })
      );
      navigate(redirectTo, { replace: true });
    } catch {
      setSubmitError("Не удалось выполнить вход. Проверьте email и пароль.");
    }
  }

  return (
    <section className="card auth-card">
      <h1>Вход</h1>
      <p className="muted">Введите данные аккаунта, чтобы продолжить.</p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />
        </label>
        <label>
          Пароль
          <input
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </label>

        {submitError && <p className="text-error">{submitError}</p>}

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Входим..." : "Войти"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 16 }}>
        Нет аккаунта? <Link to="/auth/register">Зарегистрироваться</Link>
      </p>
    </section>
  );
}
