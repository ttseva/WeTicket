import { Link } from "react-router-dom";

export function NotFoundPage(): JSX.Element {
  return (
    <section className="card">
      <h1>Страница не найдена</h1>
      <p className="muted">Проверьте адрес страницы или вернитесь в каталог мероприятий.</p>
      <Link to="/">Перейти в каталог</Link>
    </section>
  );
}
