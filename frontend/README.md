# Frontend (TicketBooking)

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create local env file from template:

```bash
copy .env.example .env
```

3. Run frontend in development:

```bash
npm run dev
```

Application starts at `http://localhost:5174`.

4. Run unit tests (Jest):

```bash
npm test
```

## Architecture baseline

- Stack: React + TypeScript + Vite
- Routing: `react-router-dom`
- State management: Redux Toolkit
- HTTP layer: RTK Query (`fetchBaseQuery`)
- Frontend port: `VITE_APP_PORT` (default `5174`)
- API base URL: `VITE_API_BASE_URL` (default `http://localhost:8080/v1`)
- Domain slices from backend/API docs:
  - `auth`
  - `events`
  - `bookings`
  - `groups`
  - `profile`
  - `admin`
  - `tickets`

## Current folder structure

```text
frontend/
  src/
    app/
      layouts/
      router.tsx
    pages/
    shared/
      api/
      config/
      ui/
```

## Next implementation priorities

1. Auth flow (register/login/logout + token storage)
2. Events catalog and event details + seats view
3. Booking flow (create/cancel/pay + pending timer UX)
4. Group purchase flow (create/join/status)
5. Profile and bookings history
6. Admin and tickets flows
