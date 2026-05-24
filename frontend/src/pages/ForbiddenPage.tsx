import { Link } from "react-router-dom";

export function ForbiddenPage(): JSX.Element {
  return (
    <section className="card">
      <h1>Доступ запрещен</h1>
      <p className="muted">
        У вас нет прав для просмотра этого раздела. Обратитесь к организатору мероприятия.
      </p>
      <Link to="/">Вернуться в каталог</Link>
    </section>
  );
}
