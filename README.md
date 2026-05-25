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

### Быстрый запуск (Frontend + Backend одновременно)

Из корневой директории проекта:

1. Установите зависимости в корневой директории, backend и frontend:
   ```bash
   npm install
   npm install --prefix backend
   npm install --prefix frontend
   ```

2. Настройте файлы окружения `.env`:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Запустите базу данных, выполните миграции и сидирование (из директории `backend`):
   ```bash
   cd backend
   npm run db:up
   npm run db:migrate
   npm run db:seed
   cd ..
   ```

4. Запустите оба приложения одной командой из корня:
   ```bash
   npm run dev
   ```

## Учетные записи:
### Зритель
```
Email: client@weticket.ru
Password: Client12345!
```
### Организатор
```
Email: organizer@weticket.ru 
Password: Organizer12345!
```