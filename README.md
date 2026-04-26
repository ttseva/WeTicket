# WeTicket
Веб-приложение для резервирования билетов на мероприятия с функцией группового бронирования.

## Локальный запуск (Docker Compose)

Запуск всех сервисов (PostgreSQL + backend + frontend):

```bash
docker compose up --build
```

После старта:

- Frontend: `http://localhost:5174`
- Backend API: `http://localhost:8080/v1`
- PostgreSQL: `localhost:5433`

Остановка:

```bash
docker compose down
```

Очистка вместе с volume БД:

```bash
docker compose down -v
```

## Локальный запуск без Docker

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Минимальные unit-тесты (Jest, frontend)

```bash
cd frontend
npm install
npm test
```
