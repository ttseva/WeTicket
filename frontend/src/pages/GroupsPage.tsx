import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyGroupSessionsQuery } from "@shared/api/groupsApi";
import { buildGroupInviteUrl, copyToClipboard } from "@shared/utils/groupInvite";

function GroupProgressBar({ paid, total }: { paid: number; total: number }): JSX.Element {
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div className="progress-block">
      <div className="progress-block__label">
        Оплачено {paid} из {total}
      </div>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function GroupsPage(): JSX.Element {
  const { data, isLoading, isError, refetch } = useGetMyGroupSessionsQuery(undefined, {
    pollingInterval: 5000
  });
  const [copyHint, setCopyHint] = useState<string | null>(null);

  async function handleCopy(inviteLink: string): Promise<void> {
    const ok = await copyToClipboard(buildGroupInviteUrl(inviteLink));
    setCopyHint(ok ? "Ссылка скопирована" : "Не удалось скопировать");
    setTimeout(() => setCopyHint(null), 2000);
  }

  return (
    <section className="page-stack">
      <section className="card">
        <h1>Мои групповые покупки</h1>
        <p className="muted">
          Создайте группу на странице мероприятия (кнопка «Купить компанией»), затем отслеживайте оплаты
          участников здесь.
        </p>
        {copyHint && <p className="muted">{copyHint}</p>}
      </section>

      <section className="card">
        {isLoading && <p className="state-message">Загрузка...</p>}
        {isError && <p className="text-error">Не удалось загрузить групповые сессии.</p>}
        {!!data && data.sessions.length === 0 && (
          <p className="muted">Групповых покупок пока нет. Перейдите в каталог и выберите «Купить компанией».</p>
        )}

        {!!data && data.sessions.length > 0 && (
          <ul className="content-list">
            {data.sessions.map((session) => (
              <li key={session.sessionId}>
                <strong>{session.event?.title ?? "Мероприятие"}</strong>
                <p className="muted" style={{ marginTop: 4 }}>
                  Статус: {session.status} · до{" "}
                  {new Date(session.expiresAt).toLocaleString("ru-RU")}
                </p>
                <GroupProgressBar paid={session.participantsCount} total={session.totalSeats} />
                <div className="form-row" style={{ marginTop: 12 }}>
                  <button type="button" onClick={() => handleCopy(session.inviteLink)}>
                    Копировать ссылку
                  </button>
                  <Link to={`/groups/${session.sessionId}`}>Подробнее</Link>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="btn-ghost" style={{ marginTop: 16 }} onClick={() => refetch()}>
          Обновить
        </button>
      </section>
    </section>
  );
}
