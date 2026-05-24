import { Link, useParams } from "react-router-dom";
import { useGetGroupSessionQuery } from "@shared/api/groupsApi";
import { buildGroupInviteUrl, copyToClipboard } from "@shared/utils/groupInvite";
import { useState } from "react";

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

export function GroupSessionPage(): JSX.Element {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [copyHint, setCopyHint] = useState<string | null>(null);
  const { data, isLoading, isError } = useGetGroupSessionQuery(sessionId ?? "", {
    skip: !sessionId,
    pollingInterval: 5000
  });

  async function handleCopyInvite(): Promise<void> {
    if (!data?.inviteLink) return;
    const ok = await copyToClipboard(buildGroupInviteUrl(data.inviteLink));
    setCopyHint(ok ? "Ссылка скопирована" : "Не удалось скопировать");
    setTimeout(() => setCopyHint(null), 2000);
  }

  if (!sessionId) {
    return <section className="card">Некорректный идентификатор сессии.</section>;
  }

  return (
    <section className="page-stack">
      <section className="card">
        <h1>Групповая покупка</h1>
        {data?.event?.title && <p className="muted">{data.event.title}</p>}

        {isLoading && <p className="state-message">Загрузка...</p>}
        {isError && <p className="text-error">Не удалось загрузить детали сессии.</p>}

        {data && (
          <>
            <GroupProgressBar paid={data.participantsCount} total={data.totalSeats} />
            <p className="muted">
              Статус: {data.status} · истекает {new Date(data.expiresAt).toLocaleString("ru-RU")}
            </p>

            <section className="invite-box">
              <h3>Ссылка для друзей</h3>
              <input readOnly value={buildGroupInviteUrl(data.inviteLink)} />
              <button type="button" onClick={handleCopyInvite} style={{ marginTop: 8 }}>
                Копировать ссылку
              </button>
              {copyHint && <p className="muted">{copyHint}</p>}
            </section>

            <h3>Участники</h3>
            {data.participants.length === 0 ? (
              <p className="muted">Пока никто не оплатил. Отправьте ссылку-приглашение.</p>
            ) : (
              <ul className="content-list">
                {data.participants.map((participant) => (
                  <li key={`${participant.userId}-${participant.seatId}`}>
                    <strong>{participant.name}</strong>
                    <span
                      className={`status-badge status-badge--${participant.paid ? "paid" : "pending"}`}
                      style={{ marginLeft: 8 }}
                    >
                      {participant.paid ? "Оплачен" : "Ожидает оплаты"}
                    </span>
                    {participant.seatLabel && (
                      <p className="muted" style={{ marginTop: 4, marginBottom: 0 }}>
                        {participant.seatLabel}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <Link to="/groups/my" className="muted card-link">
        ← К моим групповым покупкам
      </Link>
    </section>
  );
}
