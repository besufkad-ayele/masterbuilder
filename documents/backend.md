# Backend (separate project)

The NestJS API lives in its own repository, sibling to this frontend:

**Path:** `/Users/hope/Documents/Work/i-Capital/Projects/masterbuilder-api`

## Running locally

```bash
# Terminal 1 — API
cd ../masterbuilder-api
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm start:dev

# Terminal 2 — Frontend (this repo)
cd ../masterbuilder
pnpm install
cp .env.example .env.local
pnpm dev
```

## Connection

Set in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

See `masterbuilder-api/README.md` for full API documentation.
