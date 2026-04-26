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
    <section style={{ display: "grid", gap: 16 }}>
      <section className="card">
        <h1>Каталог мероприятий</h1>
        <p className="muted">Поиск, фильтры и переход на карточку события.</p>
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по названию, описанию, площадке"
            style={{ flex: 1, minWidth: 240, padding: 10 }}
          />
          <select
            value={filters.category ?? ""}
            onChange={(event) => updateParam("category", event.target.value || undefined)}
            style={{ padding: 10 }}
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
            style={{ padding: 10 }}
          >
            <option value="date">Сначала ближайшие</option>
            <option value="date_desc">Сначала поздние</option>
            <option value="title">По названию</option>
          </select>
          <button type="submit">Найти</button>
        </form>
      </section>

      {isLoading && <section className="card">Загрузка мероприятий...</section>}
      {isError && <section className="card">Не удалось загрузить каталог.</section>}

      {!!data && (
        <>
          <section
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))"
            }}
          >
            {data.events.map((event) => (
              <article key={event.id} className="card">
                <h3 style={{ marginTop: 0 }}>{event.title}</h3>
                <p className="muted" style={{ margin: "8px 0" }}>
                  {new Date(event.dateTime).toLocaleString("ru-RU")} · {event.venue}
                </p>
                <p>{event.description.slice(0, 120)}...</p>
                <Link to={`/events/${event.id}`}>Открыть карточку</Link>
              </article>
            ))}
          </section>

          <section className="card" style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
