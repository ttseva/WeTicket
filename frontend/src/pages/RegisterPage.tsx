import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@shared/api/authApi";
import type { UserRole } from "@shared/api/types";

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: Exclude<UserRole, "admin">;
};

export function RegisterPage(): JSX.Element {
  const [form, setForm] = useState<RegisterFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    role: "client",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [register, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitError(null);

    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        role: form.role,
      }).unwrap();
      navigate("/auth/login", { replace: true });
    } catch {
      setSubmitError("Не удалось зарегистрироваться. Проверьте введенные данные.");
    }
  }

  return (
    <section className="card auth-card auth-card--wide">
      <h1>Регистрация</h1>
      <p className="muted">Создайте аккаунт, чтобы бронировать билеты и отслеживать заказы.</p>
      <form onSubmit={handleSubmit} className="form-grid">
        <label>
          Имя
          <input
            required
            value={form.firstName}
            onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
          />
        </label>
        <label>
          Фамилия
          <input
            required
            value={form.lastName}
            onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
          />
        </label>
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
            minLength={6}
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />
        </label>
        <label>
          Тип аккаунта
          <select
            required
            value={form.role}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                role: event.target.value as RegisterFormState["role"],
              }))
            }
          >
            <option value="client">Зритель</option>
            <option value="organizer">Организатор</option>
          </select>
        </label>
        <label>
          Телефон (опционально)
          <input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
        </label>

        {submitError && <p className="text-error">{submitError}</p>}

        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Регистрируем..." : "Зарегистрироваться"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 16 }}>
        Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
      </p>
    </section>
  );
}
