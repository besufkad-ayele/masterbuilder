# API Integration — Completed

The frontend (`masterbuilder`) now runs against the NestJS API (`masterbuilder-api`) when `NEXT_PUBLIC_USE_API=true`.

## Quick start

### 1. Start PostgreSQL

Use Docker or local Postgres on port 5432 with database `masterbuilder`.

### 2. Start the API

```bash
cd masterbuilder-api
pnpm install
pnpm db:push
pnpm db:seed
pnpm start:dev
```

API: http://localhost:3001/api/v1  
Swagger: http://localhost:3001/api/docs

### 3. Start the frontend

```bash
cd masterbuilder
pnpm install
pnpm dev
```

Frontend: http://localhost:3000

### 4. Login

- **Admin:** `admin@masterbuilder.com` / `Password123!`

## Environment

**Frontend** (`.env`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_USE_API=true
```

**API** (`.env`):

```bash
DATABASE_URL=postgresql://masterbuilder:masterbuilder@localhost:5432/masterbuilder
JWT_SECRET=your-secret
CORS_ORIGIN=http://localhost:3000
API_PUBLIC_URL=http://localhost:3001
```

## What's integrated

| Area | Status |
|------|--------|
| Auth (login, me, change password) | ✅ |
| Admin dashboard | ✅ |
| Fellow dashboard (aggregated endpoint) | ✅ |
| Coach dashboard (aggregated endpoint) | ✅ |
| Users, companies, cohorts (+ waves) | ✅ |
| Fellows, facilitators, coaches, admins | ✅ |
| Competencies, grounding, notifications | ✅ |
| Progress (portfolios, phase progress, grounding results) | ✅ |
| Exams & examinations | ✅ |
| File upload (logos) | ✅ MinIO (S3-compatible) |

## Architecture

```
Browser → Next.js (port 3000)
              ↓ fetch + JWT
         NestJS API (port 3001)
              ↓ Prisma
         PostgreSQL
```

When `NEXT_PUBLIC_USE_API=false`, the app falls back to Firebase/Firestore.

## Verified end-to-end (MinIO upload)

Test run against local API + MinIO:

1. `POST /api/v1/auth/login` → JWT received
2. `POST /api/v1/files/upload` with Bearer token → `http://localhost:9000/masterbuilder/uploads/...`
3. `GET` on returned URL → **200 OK**

## API coverage (when `NEXT_PUBLIC_USE_API=true`)

All service-layer entry points route to NestJS API:

- `firebaseService` (admin, fellow, coach, shared getters, notifications, auth)
- `companyService`, `CohortService`, `FellowService`, `FacilitatorService`, `CoachService`
- `competencyService`, `groundingService`, `FellowProgressService`, `ExamService`
- `AdminManagementService`, `AdminDashboardContext`, `use-dashboard` hooks

Firebase is only used as fallback when `NEXT_PUBLIC_USE_API=false`.

## Not migrated

- Legacy Next.js routes (`/api/admin/users`, `/api/db/seed`) — unused when API mode is on
- Firestore data migration script (seed data only in Postgres)
- Portfolio evidence still accepts Google Drive links (optional: add MinIO file picker)
