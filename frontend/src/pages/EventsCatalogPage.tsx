import { useGetEventsQuery } from "@shared/api/eventsApi";
import { EventCategory } from "@shared/api/types";
import { FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const categories: Array<{ value: EventCategory; label: string }> = [
  { value: "theatre", label: "Театр" },
  { value: "cinema", label: "Кино" },
  { value: "concert", label: "Концерт" },
  { value: "conference", label: "Конференция" }
];

export function EventsCatalogPage(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? "date",
      page: Number(searchParams.get("page") ?? 1),
      limit: 8
    }),
    [searchParams]
  );

  const { data, isLoading, isError } = useGetEventsQuery(filters);

  function updateParam(name: string, value?: string): void {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    if (name !== "page") {
      next.set("page", "1");
    }
    setSearchParams(next);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    updateParam("search", searchInput.trim() || undefined);
  }

  const page = data?.pagination.page ?? filters.page;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <section className="page-stack">
      <section className="card">
        <h1>Каталог мероприятий</h1>
        <p className="muted">Поиск, фильтры и переход на карточку события.</p>
        <form onSubmit={handleSearchSubmit} className="form-row form-row--filters">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по названию, описанию, площадке"
          />
          <select
            value={filters.category ?? ""}
            onChange={(event) => updateParam("category", event.target.value || undefined)}
          >
            <option value="">Все категории</option>
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sort ?? "date"}
            onChange={(event) => updateParam("sort", event.target.value)}
          >
            <option value="date">Сначала ближайшие</option>
            <option value="date_desc">Сначала поздние</option>
            <option value="title">По названию</option>
          </select>
          <button type="submit" className="btn-primary">
            Найти
          </button>
        </form>
      </section>

      {isLoading && <section className="card state-message">Загрузка мероприятий...</section>}
      {isError && <section className="card state-message">Не удалось загрузить каталог.</section>}

      {!!data && (
        <>
          <section className="card-grid">
            {data.events.map((event) => (
              <article key={event.id} className="card event-card card--hover">
                <h3>{event.title}</h3>
                <p className="muted event-card__meta">
                  {new Date(event.dateTime).toLocaleString("ru-RU")} · {event.venue}
                </p>
                <p className="event-card__desc">{event.description.slice(0, 120)}...</p>
                <Link to={`/events/${event.id}`} className="card-link">
                  Открыть карточку →
                </Link>
              </article>
            ))}
          </section>

          <section className="card pagination">
            <button disabled={page <= 1} onClick={() => updateParam("page", String(page - 1))}>
              Назад
            </button>
            <span className="muted">
              Страница {page} из {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParam("page", String(page + 1))}
            >
              Вперед
            </button>
          </section>
        </>
      )}
    </section>
  );
}
