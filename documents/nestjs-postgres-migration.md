# Masterbuilder Backend Migration: NestJS + PostgreSQL

This document describes how to migrate the Masterbuilder platform from a **Firebase-centric backend** (Firestore + Firebase Auth + Firebase Storage, accessed directly from the Next.js client) to a **dedicated NestJS API** backed by **PostgreSQL**.

---

## 1. Current State

### 1.1 Architecture today

```text
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 App                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   UI Pages   │  │ src/services │  │  API Routes  │ │
│  │  (dashboard) │──│ (14 files)   │  │  (5 routes)  │ │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘ │
└───────────────────────────┼─────────────────┼─────────┘
                            │                 │
              Client SDK    │                 │ Admin SDK
                            ▼                 ▼
              ┌─────────────────────────────────────────┐
              │              Firebase                      │
              │  Auth │ Firestore │ Storage              │
              └─────────────────────────────────────────┘
```

**Key characteristics:**

| Area | Current implementation |
|------|------------------------|
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Data access | `src/services/*` call Firestore directly from the browser |
| Auth | Firebase Auth (email/password), custom claims for RBAC |
| File uploads | Firebase Storage (`companyService.ts`) |
| Server logic | Thin Next.js API routes (`/api/admin/users`, `/api/db/seed`) |
| Types | Relational models in `src/types/index.ts` (already DBML-aligned) |
| ORM | `@prisma/client` in `package.json` but **no schema yet** |

### 1.2 Firestore collections to migrate

These map 1:1 (or nearly) to PostgreSQL tables:

| Collection | Domain |
|------------|--------|
| `users` | Core identity |
| `admin_profiles`, `facilitator_profiles`, `fellow_profiles`, `coach_profiles` | Role profiles |
| `companies` | Organizations |
| `cohorts`, `waves`, `wave_competencies` | Program structure |
| `competencies`, `behavioral_indicators`, `phases` | Learning content |
| `competency_dictionary`, `competency_library` | Competency framework |
| `grounding_modules`, `grounding_submissions`, `grounding_results` | Grounding flow |
| `phase_progress`, `portfolios`, `wave_results` | Progress & evaluation |
| `peer_circles` | Coaching groups |
| `notifications` | Platform announcements |
| `exams`, `exam_attempts`, `examinations`, `examination_attempts`, `competency_question_banks` | Assessments |

### 1.3 Services to replace

Each file in `src/services/` becomes a NestJS module (or is absorbed into one):

| Service file | NestJS module |
|--------------|---------------|
| `firebaseService.ts` | Split across domain modules |
| `AdminManagementService.ts` | `AdminModule` |
| `companyService.ts` | `CompaniesModule` |
| `CohortService.ts` | `CohortsModule` |
| `FellowService.ts` | `FellowsModule` |
| `FacilitatorService.ts` | `FacilitatorsModule` |
| `CoachService.ts` | `CoachesModule` |
| `competencyService.ts` | `CompetenciesModule` |
| `groundingService.ts` | `GroundingModule` |
| `FellowProgressService.ts` | `ProgressModule` |
| `ExamService.ts` | `ExamsModule` |
| `storageService.ts` | Keep client-side session only; files move to `FilesModule` |

---

## 2. Target Architecture

### 2.1 High-level design

```text
┌──────────────────────┐         REST/JSON          ┌──────────────────────┐
│   Next.js Frontend   │ ◄────────────────────────► │   NestJS API         │
│   (UI only)          │    Bearer JWT / cookies    │   (business logic)   │
└──────────────────────┘                            └──────────┬───────────┘
                                                               │
                                                    ┌──────────┼──────────┐
                                                    ▼          ▼          ▼
                                              PostgreSQL   S3/R2     Redis (opt)
```

**Principles:**

1. **No direct database access from the browser.** All reads/writes go through the NestJS API.
2. **PostgreSQL is the source of truth** for relational domain data.
3. **Next.js keeps UI routing**; it becomes a pure frontend consumer of the API.
4. **Shared types** can be copied or published as an npm package if needed later (optional).

### 2.2 Project layout (separate repositories)

The frontend and backend are **independent projects**:

```text
Projects/
├── masterbuilder/          # Next.js frontend (this repo)
│   ├── src/
│   ├── public/
│   └── package.json
│
└── masterbuilder-api/      # NestJS backend (separate repo)
    ├── src/
    ├── prisma/
    ├── docker/
    └── package.json
```

Each project has its own `package.json`, dependencies, and git history. Deploy and scale them independently.

---

## 3. Tooling Stack

### 3.1 Required tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **NestJS** (`@nestjs/core`, CLI) | API framework | Modules, guards, pipes, DI |
| **PostgreSQL 16+** | Primary database | Relational data, ACID transactions |
| **Prisma** | ORM + migrations | Already in deps; best fit for typed schema |
| **Docker Compose** | Local infra | Postgres + optional Redis/MinIO |
| **class-validator** + **class-transformer** | Request validation | NestJS standard; mirrors existing Zod usage |
| **@nestjs/swagger** | API documentation | Auto-generated OpenAPI for frontend team |
| **Passport + JWT** | Authentication | Replace Firebase Auth (see §5) |
| **bcrypt** | Password hashing | Store `password_hash` on `users` table |
| **S3-compatible storage** | File uploads | Replace Firebase Storage |

### 3.2 Recommended tools

| Tool | Purpose | When to add |
|------|---------|-------------|
| **Redis** | Session cache, rate limiting | When auth traffic or dashboard aggregation grows |
| **BullMQ** (`@nestjs/bullmq`) | Background jobs | Excel exports, bulk notifications, migration scripts |
| **MinIO** | Local S3 emulator | Development file upload parity |
| **AWS S3** or **Cloudflare R2** | Production object storage | Deployment |
| **pgAdmin** or **TablePlus** | DB inspection | Development |
| **Testcontainers** | Integration tests | CI pipeline with real Postgres |
| **@nestjs/throttler** | Rate limiting | Public/auth endpoints |
| **Helmet** | Security headers | Production hardening |
| **Pino** (`nestjs-pino`) | Structured logging | Production observability |

### 3.3 CI/CD additions

| Stage | Command |
|-------|---------|
| Lint API | `pnpm --filter api lint` |
| Unit tests | `pnpm --filter api test` |
| Prisma validate | `pnpm --filter database prisma validate` |
| Migration check | `prisma migrate diff` in CI |
| Integration tests | Testcontainers + `jest --config jest-e2e.json` |
| Build | `pnpm --filter api build` + `pnpm --filter web build` |

### 3.4 Environment variables (new)

```bash
# masterbuilder-api/.env
DATABASE_URL="postgresql://masterbuilder:masterbuilder@localhost:5432/masterbuilder?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
PORT=3001
API_PREFIX="api/v1"

# Object storage (S3-compatible) — add when files module is implemented
S3_ENDPOINT="http://localhost:9000"
S3_BUCKET="masterbuilder-uploads"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_REGION="us-east-1"
```

```bash
# masterbuilder/.env.local (frontend)
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
# Remove Firebase vars after cutover
```

---

## 4. PostgreSQL Schema Design

Types in `src/types/index.ts` are already relational. Prisma schema should mirror them with proper foreign keys, indexes, and enums.

### 4.1 Core entity relationships

```mermaid
erDiagram
    users ||--o| admin_profiles : has
    users ||--o| facilitator_profiles : has
    users ||--o| fellow_profiles : has
    users ||--o| coach_profiles : has

    companies ||--o{ cohorts : owns
    cohorts ||--o{ waves : contains
    waves ||--o{ wave_competencies : assigns
    competencies ||--o{ wave_competencies : linked

    competencies ||--o{ behavioral_indicators : has
    behavioral_indicators ||--o{ phases : has

    users ||--o{ phase_progress : tracks
    users ||--o{ portfolios : submits
    users ||--o{ wave_results : earns

    companies ||--o{ grounding_modules : optional
    users ||--o{ grounding_results : completes

    coach_profiles ||--o{ peer_circles : leads
    cohorts ||--o{ peer_circles : groups
```

### 4.2 Schema conventions

| Firestore pattern | PostgreSQL equivalent |
|-------------------|----------------------|
| Document `id` string | `UUID` primary key (`gen_random_uuid()`) |
| `user_id`, `company_id` refs | `FOREIGN KEY` with `ON DELETE` rules |
| `created_at`, `updated_at` strings | `TIMESTAMPTZ` with `@default(now())` |
| Nested JSON (`structure`, `proficiency_levels`) | `JSONB` column (indexed with GIN where queried) |
| `company_ids: string[]` on facilitators | Join table `facilitator_company_assignments` |
| `fellow_ids: string[]` on peer circles | Join table `peer_circle_members` |
| `evidence_urls: string[]` | `TEXT[]` or separate `portfolio_evidence` table |

### 4.3 JSONB vs normalized tables

Keep as **JSONB** (matches current Firestore docs, fewer joins):

- `grounding_modules.structure`
- `competency_dictionary.proficiency_levels`
- `competency_library.competency` (behavioral indicators + resources)
- `grounding_results.completed_content`
- Quiz question arrays inside grounding/competency content

Normalize into tables when you need:

- Cross-entity reporting (e.g. "all quiz scores across cohorts")
- Strict referential integrity on nested IDs
- Full-text search on article content

### 4.4 Prisma location (masterbuilder-api)

```text
masterbuilder-api/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── src/
    └── prisma/
        ├── prisma.module.ts
        └── prisma.service.ts
```

Example enum mapping from `src/types/index.ts`:

```prisma
enum UserRole {
  ADMIN
  FACILITATOR
  FELLOW
  COACH
}

enum PhaseType {
  believe
  know
  do
}

enum PortfolioStatus {
  draft
  submitted
  under_review
  approved
  rejected
  resubmitted
}
```

---

## 5. Authentication Strategy

### 5.1 Options

| Option | Pros | Cons |
|--------|------|------|
| **A. Full migration to JWT (recommended)** | Full control, no Firebase vendor lock-in, Postgres owns users | Must migrate existing Firebase users |
| **B. Keep Firebase Auth, verify tokens in NestJS** | Faster cutover, no password migration | Still dependent on Firebase for auth |
| **C. Hybrid (Firebase → JWT over time)** | Gradual migration | Two auth paths during transition |

**Recommendation: Option A** for a clean long-term architecture. Option B is acceptable if you need a faster first release.

### 5.2 JWT auth flow (Option A)

```text
1. POST /api/v1/auth/login        → { accessToken, refreshToken, user }
2. POST /api/v1/auth/refresh      → new accessToken
3. POST /api/v1/auth/logout       → invalidate refresh token (Redis blacklist)
4. All protected routes           → Authorization: Bearer <accessToken>
5. NestJS JwtAuthGuard + RolesGuard → enforce UserRole from token payload
```

**NestJS modules:**

- `AuthModule` — login, register (admin-only), refresh, password change
- `UsersModule` — CRUD (replaces `/api/admin/users`)
- `JwtStrategy` — validates token, loads user from Postgres

**Role enforcement:** Map `UserRole` enum to `@Roles('ADMIN')` decorator + `RolesGuard`, replacing Firebase custom claims.

### 5.3 Firebase Auth bridge (Option B, interim)

If keeping Firebase Auth temporarily:

1. Frontend still signs in with Firebase SDK.
2. Frontend sends Firebase ID token to `POST /api/v1/auth/firebase`.
3. NestJS verifies token with `firebase-admin`.
4. NestJS issues its own JWT for subsequent API calls.
5. User record synced to Postgres on first login.

---

## 6. NestJS Module Structure

### 6.1 Proposed modules

```text
apps/api/src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/          # JwtAuthGuard, RolesGuard
│   ├── decorators/      # @CurrentUser(), @Roles()
│   ├── filters/         # HttpExceptionFilter
│   ├── interceptors/    # Logging, transform
│   └── pipes/           # ValidationPipe
├── auth/
├── users/
├── companies/
├── cohorts/
│   ├── waves.controller.ts
│   └── waves.service.ts
├── fellows/
├── facilitators/
├── coaches/
├── competencies/
│   ├── dictionary/
│   └── library/
├── grounding/
├── progress/            # phase_progress, portfolios, wave_results
├── exams/
├── notifications/
├── files/               # S3 upload/download, presigned URLs
├── admin/               # dashboard aggregation endpoints
└── health/              # GET /health for load balancers
```

### 6.2 API route mapping

Map existing service methods to REST endpoints. Example:

| Current (Firestore service) | New REST endpoint |
|---------------------------|-------------------|
| `firebaseService.admin.getDashboardState()` | `GET /api/v1/admin/dashboard` |
| `companyService.createCompany()` | `POST /api/v1/companies` |
| `CohortService.createCohortWithWaves()` | `POST /api/v1/cohorts` (with nested waves) |
| `FellowService.createFellow()` | `POST /api/v1/fellows` |
| `groundingService.getModules()` | `GET /api/v1/grounding-modules` |
| `FellowProgressService.submitPortfolio()` | `POST /api/v1/portfolios` |
| `ExamService.submitExamAttempt()` | `POST /api/v1/exams/:id/attempts` |
| `POST /api/admin/users` | `POST /api/v1/users` (admin only) |

Use **API versioning** (`/api/v1`) from day one.

### 6.3 Dashboard aggregation

Today `getDashboardState()` loads entire collections client-side. In NestJS:

- Build dedicated aggregation queries with Prisma `include` / raw SQL.
- Add pagination (`?page=1&limit=50`) on list endpoints.
- Cache expensive admin dashboard stats in Redis (TTL 30–60s).

---

## 7. File Storage Migration

### 7.1 Current usage

- Company logos uploaded via Firebase Storage (`companyService.ts`).
- Portfolio evidence URLs stored as strings in Firestore.

### 7.2 Target

| Concern | Solution |
|---------|----------|
| Upload | `POST /api/v1/files/upload` → presigned URL or direct multipart |
| Storage | S3 bucket (`companies/{id}/logo`, `portfolios/{id}/evidence`) |
| Local dev | MinIO via Docker Compose |
| Access control | NestJS validates ownership before issuing presigned GET |
| DB reference | Store `file_key` or public URL in `companies.logo_url`, `portfolios.evidence_urls` |

**Package:** `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`

---

## 8. Frontend Changes

### 8.1 Service layer refactor

Replace direct Firestore calls with HTTP calls to the API:

```text
Before:  FellowService.ts → firebase/firestore
After:   FellowService.ts → apiClient.get('/fellows')
```

`src/lib/api/index.ts` already has an `ApiClient` class. Extend it:

- Add auth header injection from `StorageService.getAuthToken()`.
- Add error handling (401 → redirect to login).
- Point `API_BASE_URL` to NestJS (`NEXT_PUBLIC_API_URL`).

### 8.2 Remove Firebase dependencies (final phase)

After cutover, remove from `apps/web`:

- `firebase`, `firebase-admin`, `firebase-tools`
- `src/lib/firebase.ts`, `src/lib/firebase-admin.ts`
- Firestore imports in all `src/services/*`
- `firestore.rules`, `firebase.json` (or keep only if using Firebase Hosting)

### 8.3 Auth UI changes

Login pages (`src/app/(portal)/login/page.tsx`, `admin-login`, `CoachLoginForm`) currently use Firebase Auth SDK. Update to:

1. Call `POST /api/v1/auth/login`.
2. Store JWT in `StorageService`.
3. Route by `user.role` (same logic as today).

### 8.4 Server Components vs client

Most dashboard pages are client components that fetch on mount. Two patterns:

| Pattern | When |
|---------|------|
| Client fetch via services | Minimal change; works immediately |
| Server Components + fetch with cookie | Better SEO/perf; adopt incrementally |

Start with client fetch; optimize later.

---

## 9. Data Migration Plan

### 9.1 Export from Firestore

Write a one-time Node script (`scripts/migrate-firestore-to-postgres.ts`):

1. Use `firebase-admin` to read all collections.
2. Transform documents to relational rows (resolve arrays → join tables).
3. Insert via Prisma in dependency order (companies → cohorts → users → profiles → …).
4. Log orphans and validation errors to a report file.

**Order of insertion:**

```text
companies
  → cohorts → waves → wave_competencies
  → competencies → behavioral_indicators → phases
  → users → role profiles
  → fellow_profiles (link cohort, company)
  → grounding_modules → grounding_results
  → phase_progress → portfolios → wave_results
  → peer_circles → notifications
  → exams / examinations + attempts
```

### 9.2 ID strategy

| Approach | Recommendation |
|----------|----------------|
| Keep Firestore string IDs | Easiest migration; use `VARCHAR` PKs |
| Generate new UUIDs | Cleaner long-term; requires ID mapping table |

**Recommendation:** Keep original IDs as `VARCHAR` primary keys during migration. Switch to UUID for new records after cutover, or migrate IDs in a second pass.

### 9.3 User/password migration

If moving off Firebase Auth:

- Export users from Firebase Auth Admin SDK.
- Users must **reset passwords** on first login (Firebase passwords are not exportable), OR
- Use Firebase import temporarily (Option B in §5) until users re-authenticate.

---

## 10. Phased Implementation Roadmap

### Phase 0 — Foundation (Week 1)

- [ ] Add `apps/api` NestJS project (CLI: `nest new api`)
- [ ] Add `packages/database` with Prisma + initial schema (users, companies)
- [ ] Docker Compose: Postgres + MinIO
- [ ] Health check endpoint
- [ ] Swagger at `/api/docs`

### Phase 1 — Auth + Users (Week 2)

- [ ] Prisma models: `users`, role profile tables
- [ ] AuthModule: login, JWT, guards, roles
- [ ] UsersModule: CRUD (port `/api/admin/users`)
- [ ] Update login UI to use new auth API
- [ ] Seed script from existing seed route

### Phase 2 — Core domain (Weeks 3–4)

- [ ] Companies, Cohorts, Waves modules
- [ ] Fellows, Facilitators, Coaches, Admins modules
- [ ] Refactor corresponding `src/services/*` to HTTP
- [ ] Admin dashboard endpoint with pagination

### Phase 3 — Learning content (Weeks 5–6)

- [ ] Competencies, Behavioral Indicators, Phases
- [ ] Competency Dictionary + Library (JSONB)
- [ ] Grounding modules + results
- [ ] Files module (logo upload)

### Phase 4 — Progress & assessments (Weeks 7–8)

- [ ] Phase progress, portfolios, wave results
- [ ] Exams + examinations modules
- [ ] Fellow dashboard aggregation endpoint
- [ ] Notifications module

### Phase 5 — Migration & cutover (Week 9)

- [ ] Firestore → Postgres migration script
- [ ] Staging environment validation
- [ ] Parallel run: write to both systems (optional safety net)
- [ ] Production cutover + Firebase read-only period
- [ ] Remove Firebase deps from frontend

### Phase 6 — Hardening (Week 10+)

- [ ] Integration + e2e tests
- [ ] Rate limiting, Helmet, CORS lockdown
- [ ] CI pipeline for API
- [ ] Background jobs for Excel export (cohort wave download feature)
- [ ] Monitoring (Sentry, Datadog, or similar)

---

## 11. Local Development Setup

### 11.1 Docker Compose (starter)

```yaml
# docker/docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: masterbuilder
      POSTGRES_PASSWORD: masterbuilder
      POSTGRES_DB: masterbuilder
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
  miniodata:
```

### 11.2 Root scripts (target)

```json
{
  "scripts": {
    "dev": "concurrently \"pnpm dev:web\" \"pnpm dev:api\"",
    "dev:web": "pnpm --filter web dev",
    "dev:api": "pnpm --filter api start:dev",
    "db:up": "docker compose -f docker/docker-compose.yml up -d",
    "db:migrate": "pnpm --filter database prisma migrate dev",
    "db:seed": "pnpm --filter database prisma db seed",
    "db:studio": "pnpm --filter database prisma studio"
  }
}
```

### 11.3 Port allocation

| Service | Port |
|---------|------|
| Next.js (web) | 3000 |
| NestJS (api) | 3001 |
| PostgreSQL | 5432 |
| MinIO API | 9000 |
| MinIO Console | 9001 |
| Redis | 6379 |
| Swagger UI | 3001/api/docs |

---

## 12. Deployment

### 12.1 Recommended hosting

| Component | Options |
|-----------|---------|
| Next.js frontend | Vercel (current) |
| NestJS API | Railway, Render, Fly.io, AWS ECS, or DigitalOcean App Platform |
| PostgreSQL | Neon, Supabase, Railway Postgres, AWS RDS |
| Object storage | AWS S3, Cloudflare R2 |
| Redis | Upstash, ElastiCache |

### 12.2 Deployment topology

```text
Vercel (web)  ──HTTPS──►  api.masterbuilder.com (NestJS)
                               │
                               ├── Managed PostgreSQL
                               ├── S3/R2 bucket
                               └── Redis (optional)
```

### 12.3 Migration checklist for production

- [ ] Run Prisma migrations on production DB
- [ ] Run Firestore export script against staging first
- [ ] Set `CORS_ORIGIN` to production frontend URL
- [ ] Rotate `JWT_SECRET` and S3 credentials
- [ ] Enable DB connection pooling (PgBouncer or Prisma Accelerate)
- [ ] Set up DB backups (daily automated)
- [ ] Feature flag: `USE_NEST_API=true` in frontend for gradual rollout

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large JSONB documents (grounding modules) | GIN indexes; consider splitting if query perf degrades |
| Dashboard was loading all data at once | Pagination + dedicated aggregation endpoints |
| Firebase Auth password migration | Force password reset or interim Firebase token bridge |
| Long migration window | Phased module rollout; feature flags per domain |
| Real-time notifications | Add WebSockets (`@nestjs/websockets`) or SSE later; not in Firestore today |
| Excel export (cohort wave download) | BullMQ job + S3 temp file; don't block HTTP request |

---

## 14. What stays the same

- Next.js App Router structure and UI components
- `src/types` enums and interfaces (move to shared package)
- Zod validations in `src/lib/validations` (reuse or mirror with class-validator)
- Role-based routing (`/admin`, `/fellow/[companyId]`, etc.)
- Business rules in `FellowProgressService`, `ExamService` (port logic to NestJS services)
- Brand/theme guide in `agent.md`

---

## 15. Next Steps

1. **Decision:** Confirm auth strategy (JWT vs Firebase bridge) and monorepo layout.
2. **Scaffold:** Create `apps/api`, `packages/database`, and `docker-compose.yml`.
3. **Schema:** Draft `schema.prisma` from `src/types/index.ts` (start with users + companies).
4. **Spike:** Implement `POST /auth/login` + `GET /companies` end-to-end (API → Prisma → frontend).
5. **Branch:** `feature/nestjs-postgres-foundation` per repo branching rules.

---

## Appendix A — NestJS package.json (starter)

```json
{
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/config": "^4.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "@nestjs/swagger": "^11.0.0",
    "@prisma/client": "workspace:*",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^4.0.0"
  }
}
```

## Appendix B — Collections → Tables quick reference

| Firestore collection | PostgreSQL table | Notes |
|---------------------|------------------|-------|
| `users` | `users` | Add `password_hash` |
| `admin_profiles` | `admin_profiles` | FK → users |
| `facilitator_profiles` | `facilitators` + `facilitator_companies` | Normalize `company_ids[]` |
| `fellow_profiles` | `fellow_profiles` | FK → users, companies, cohorts |
| `coach_profiles` | `coach_profiles` | FK → users |
| `companies` | `companies` | |
| `cohorts` | `cohorts` | FK → companies |
| `waves` | `waves` | FK → cohorts |
| `wave_competencies` | `wave_competencies` | FK → waves, competencies |
| `competencies` | `competencies` | |
| `behavioral_indicators` | `behavioral_indicators` | FK → competencies |
| `phases` | `phases` | FK → behavioral_indicators |
| `phase_progress` | `phase_progress` | FK → users, behavioral_indicators |
| `portfolios` | `portfolios` | FK → users, behavioral_indicators |
| `wave_results` | `wave_results` | FK → users, waves |
| `grounding_modules` | `grounding_modules` | `structure` as JSONB |
| `grounding_results` | `grounding_results` | |
| `grounding_submissions` | `grounding_submissions` | |
| `competency_dictionary` | `competency_dictionaries` | `proficiency_levels` as JSONB |
| `competency_library` | `competency_libraries` | `competency` as JSONB |
| `peer_circles` | `peer_circles` + `peer_circle_members` | Normalize `fellow_ids[]` |
| `notifications` | `notifications` | |
| `exams` | `exams` | |
| `exam_attempts` | `exam_attempts` | |
| `examinations` | `examinations` | |
| `examination_attempts` | `examination_attempts` | |
| `competency_question_banks` | `competency_question_banks` | |

---

*Document version: 1.0 — aligned with codebase as of July 2026*
