import { FormEvent, useEffect, useState } from "react";
import { useAppDispatch } from "@app/hooks";
import { setCurrentUser } from "@shared/store/authSlice";
import { useGetCurrentUserQuery, useUpdateCurrentUserMutation } from "@shared/api/usersApi";

type ProfileFormState = {
  firstName: string;
  lastName: string;
  phone: string;
};

export function ProfilePage(): JSX.Element {
  const dispatch = useAppDispatch();
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();
  const [updateCurrentUser, { isLoading: isSaving }] = useUpdateCurrentUserMutation();
  const [form, setForm] = useState<ProfileFormState>({ firstName: "", lastName: "", phone: "" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phone: user.phone ?? ""
      });
    }
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);

    try {
      const updated = await updateCurrentUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim()
      }).unwrap();
      dispatch(setCurrentUser(updated));
      setMessage("Профиль сохранен.");
    } catch {
      setMessage("Не удалось обновить профиль.");
    }
  }

  return (
    <section className="card" style={{ maxWidth: 680 }}>
      <h1>Личный кабинет</h1>
      <p className="muted">Редактирование профиля пользователя.</p>

      {isLoading && <p>Загрузка профиля...</p>}
      {isError && <p>Не удалось загрузить профиль.</p>}

      {user && (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <label>
            Email
            <input value={user.email} disabled style={{ width: "100%", marginTop: 4, padding: 8 }} />
          </label>
          <label>
            Имя
            <input
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              style={{ width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <label>
            Фамилия
            <input
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              style={{ width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <label>
            Телефон
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              style={{ width: "100%", marginTop: 4, padding: 8 }}
            />
          </label>
          <button type="submit" disabled={isSaving} style={{ width: "fit-content" }}>
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </form>
      )}

      {message && <p className="muted">{message}</p>}
    </section>
  );
}
