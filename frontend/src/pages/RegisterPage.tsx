import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@shared/api/authApi";

type RegisterFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
};

export function RegisterPage(): JSX.Element {
  const [form, setForm] = useState<RegisterFormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: ""
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
        phone: form.phone || undefined
      }).unwrap();
      navigate("/auth/login", { replace: true });
    } catch {
      setSubmitError("Не удалось зарегистрироваться. Проверьте введенные данные.");
    }
  }

  return (
    <section className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1>Регистрация</h1>
      <p className="muted">Создайте аккаунт, чтобы бронировать билеты и отслеживать заказы.</p>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Имя
          <input
            required
            value={form.firstName}
            onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>
        <label>
          Фамилия
          <input
            required
            value={form.lastName}
            onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>
        <label>
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
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
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>
        <label>
          Телефон (опционально)
          <input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            style={{ width: "100%", padding: 10, marginTop: 4 }}
          />
        </label>

        {submitError && <p style={{ color: "#dc2626", margin: 0 }}>{submitError}</p>}

        <button type="submit" disabled={isLoading} style={{ padding: 10 }}>
          {isLoading ? "Регистрируем..." : "Зарегистрироваться"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: 16 }}>
        Уже есть аккаунт? <Link to="/auth/login">Войти</Link>
      </p>
    </section>
  );
}
