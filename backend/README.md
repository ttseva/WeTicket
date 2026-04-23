# Backend (TicketBooking)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create local env file from template:

```bash
copy .env.example .env
```

3. Start PostgreSQL for local development (Docker):

```bash
npm run db:up
```

4. Apply schema and generate Prisma Client:

```bash
npm run db:migrate
npm run db:generate
```

5. Fill development DB with demo data:

```bash
npm run db:seed
```

6. Run backend in development:

```bash
npm run dev
```

Server starts at `http://localhost:8080`.

## Database (PostgreSQL + Prisma)

- Main ORM: Prisma (`prisma/schema.prisma`)
- Local test DB: PostgreSQL in `docker-compose.yml`
- Main connection string is in `.env` via `DATABASE_URL`

Useful commands:

```bash
npm run db:up       # start PostgreSQL
npm run db:down     # stop and remove containers
npm run db:migrate  # create/apply migration from schema
npm run db:push     # sync schema without migrations
npm run db:generate # regenerate Prisma client
npm run db:seed     # run development seed
npm run db:studio   # open Prisma Studio
```

If Docker is not available, install PostgreSQL locally and set your own `DATABASE_URL` in `.env`.

## Background expiration job

A lightweight in-process background job runs with the API server and handles:

- expiration of pending bookings (`status: pending` -> `expired`)
- expiration of group sessions (`status: active` -> `expired`)
- seat release for expired bookings/sessions (`blocked`/`group_blocked` -> `free`)
- group payment progress sync (`participantsCount`) and completion status

Environment variables:

```bash
EXPIRATION_JOB_ENABLED=true
EXPIRATION_JOB_INTERVAL_MS=60000
```

## Security and access basics

Implemented in backend:

- JWT access/refresh tokens
- Password hashing with `bcryptjs`
- Auth middleware for protected routes
- Role-based middleware (`admin`, `organizer`, `client`)
- Basic rate limiting for API and auth routes

Environment variables required:

```bash
JWT_ACCESS_SECRET=replace_with_strong_access_secret
JWT_REFRESH_SECRET=replace_with_strong_refresh_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
```

Initial routes for access control testing:

- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `POST /v1/auth/logout` (requires access token)
- `GET /v1/users/me` (requires access token)
- `GET /v1/admin/ping` (requires admin role)

## JSDoc

Generate docs from JSDoc comments:

```bash
npm run docs
```

Generated static documentation appears in `docs/api`.

Rebuild docs from scratch:

```bash
npm run docs:build
```
