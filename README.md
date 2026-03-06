# Lead Life Platform

<p align="center">
	<img src="./public/hero.jpg" alt="Lead Life hero" width="100%" />
</p>

<p align="center">
	Leadership development platform for Admins, Facilitators, and Fellows.
</p>

<p align="center">
	<img src="https://img.shields.io/badge/Next.js-16.1-black" alt="Next.js 16" />
	<img src="https://img.shields.io/badge/React-19-149ECA" alt="React 19" />
	<img src="https://img.shields.io/badge/TypeScript-5-3178C6" alt="TypeScript 5" />
	<img src="https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Storage-FFCA28" alt="Firebase stack" />
	<img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4" alt="Tailwind v4" />
</p>

---

## Branching And GitHub Rules (Read First)

Use this repository with a branch-first workflow. Never commit directly to `main`.

### 1. Branch Naming Rules

Branch names must follow this format:

```text
<type>/<short-kebab-description>
```

Allowed branch types:

- `bug/`: bug fixes only
- `feature/`: new features
- `hotfix/`: urgent production fixes
- `chore/`: maintenance tasks (deps, tooling, config)
- `docs/`: documentation-only changes
- `refactor/`: code restructuring with no intended behavior change
- `test/`: test-only work
- `release/`: release preparation branches

Examples:

- `bug/login-redirect-loop`
- `feature/admin-cohort-health-widget`
- `hotfix/firestore-permission-failure`
- `chore/update-eslint-config`
- `docs/readme-branching-policy`

Rules:

- Use lowercase letters only.
- Use hyphens (`-`), not underscores.
- Keep names short but descriptive.
- Include ticket ID when available, for example: `feature/ll-214-grounding-editor`.

### 2. Commit Message Rules

Use Conventional Commit style:

```text
<type>(optional-scope): short summary
```

Common commit types:

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `refactor`: internal code change
- `test`: tests
- `chore`: maintenance

Examples:

- `fix(auth): prevent fellow redirect to admin tab`
- `feat(admin): add competency progress summary cards`
- `docs(readme): add branching and github workflow rules`

### 3. Pull Request Rules

Every PR should:

- Target `main` (unless release workflow specifies otherwise).
- Have a clear title following commit style where possible.
- Link an issue or ticket.
- Include a short description of:
	- what changed,
	- why it changed,
	- how it was tested,
	- any migration or env impact.
- Include screenshots or short recordings for UI changes.
- Stay focused; avoid mixing unrelated concerns.

Recommended PR checklist:

- [ ] Branch name follows convention.
- [ ] Lint passes locally (`pnpm lint`).
- [ ] Build passes locally (`pnpm build`).
- [ ] Manual test steps added for UI/flow changes.
- [ ] No secrets or credentials committed.

### 4. Review And Approval Rules

- At least 1 reviewer approval required before merge.
- Author should resolve all review comments.
- Conversations must be marked resolved before merge.
- Re-request review after significant updates.

### 5. Merge Strategy Rules

- Prefer `Squash and merge` for most PRs to keep history clean.
- PR title should read well as a standalone change record.
- Delete branch after merge.
- Do not merge if CI is failing.

### 6. Protected Branch Guidance

For `main`, enable these repository settings:

- Require pull request before merging.
- Require status checks to pass.
- Require at least 1 approval.
- Dismiss stale approvals when new commits are pushed.
- Block force pushes.
- Block branch deletion.

### 7. GitHub Issue Usage Rules

- Create an issue before major work.
- Use labels consistently (for example: `bug`, `feature`, `docs`, `priority:high`).
- Keep acceptance criteria in the issue description.
- Close issues via PR using keywords like `Fixes #123`.

### 8. CI/CD Safety Rules

- Keep secrets in GitHub/Vercel/Firebase secret stores only.
- Never commit `.env.local`.
- Treat production-impacting changes as two-step:
	1. merge to `main`,
	2. verify deployment health and logs.

---

## What This Project Is

Lead Life is a role-based learning and performance platform that helps organizations run structured leadership programs across:

- `Admin` workspaces for managing companies, cohorts, users, competencies, and grounding modules.
- `Facilitator` workspaces for cohort guidance and performance tracking.
- `Fellow` workspaces for learning progression, assessments, and portfolio submissions.

The app is built with the Next.js App Router, Firebase (Auth + Firestore + Storage), and reusable UI components.

---

## UI Preview

<p align="center">
	<img src="./public/i-Capital%20Africa%20Institute.webp" alt="Lead Life brand visual" width="420" />
</p>

---

## Core Capabilities

- `Role-based access`: redirects and tab-level access control for Admin, Facilitator, and Fellow experiences.
- `Admin dashboard`: company, cohort, fellow, facilitator, competency, and grounding management.
- `Grounding module flow`: dictionary-based content and mixed content sources (markdown + links).
- `Performance model`: grounding, behavioral indicators, and competency-level evaluation.
- `Operational UX`: loading states, optimistic feel for management actions, and cached dashboard data.

See implementation notes in:

- `documents/admin-dashboard-overview.md`
- `documents/performance_tracking_logic.md`
- `documents/dependency-test-plan.md`
- `documents/manual-testing-checklist.md`

---

## Tech Stack

- `Framework`: Next.js 16 (App Router)
- `Language`: TypeScript
- `UI`: Tailwind CSS v4, Radix UI primitives, Lucide icons
- `Data + Auth`: Firebase Auth, Firestore, Firebase Storage
- `Validation + State`: Zod, Zustand
- `Tooling`: ESLint, PostCSS, Firebase tools, Prisma client (available in deps)

---

## Project Structure

```text
src/
	app/
		(dashboard)/           # role dashboards
		(portal)/              # auth and public portal
		api/                   # server routes
		onboarding/
	components/
		features/              # domain-specific UI blocks
		layout/                # navigation/sidebar/shell
		ui/                    # reusable base components
	lib/                     # firebase clients, shared helpers
	services/                # business/data service layer
	stores/                  # client state
	types/                   # shared typings
documents/                 # implementation docs and test checklists
public/                    # static assets
```

---

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create environment file

Create `.env.local` in the project root:

```bash
# Client Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin SDK config (server-side)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

Notes:

- `FIREBASE_PRIVATE_KEY` should preserve newlines; escaped `\n` is handled in `src/lib/firebase-admin.ts`.
- If admin credentials are missing, the app skips admin SDK initialization.

### 3. Run development server

```bash
pnpm dev
```

Open `http://localhost:3000`.

---

## Scripts

```bash
pnpm dev      # start local dev server
pnpm build    # production build
pnpm start    # run production server
pnpm lint     # run eslint
```

---

## Routing Highlights

- `/(portal)/login`: role-aware login flow.
- `/(dashboard)/admin`: admin workspace (tab-driven).
- `/(dashboard)/facilitator/[companyid]`: facilitator workspace.
- `/(dashboard)/fellow/[companyid]`: fellow workspace.

---

## Development Notes

- Keep services in `src/services` as the primary data-access boundary.
- Keep shared UI primitives in `src/components/ui` and domain features in `src/components/features`.
- Use documents in `documents/` as the source of truth for operational and test flows.

---

## Deployment

This project can be deployed on Vercel or any Node-compatible host that supports Next.js.

Recommended:

1. Set all environment variables in the hosting platform.
2. Run `pnpm build` during CI.
3. Confirm Firebase project permissions (Firestore rules, Storage rules, Auth providers).

---

## Troubleshooting

- `Login succeeds but routing fails`: verify user profile docs exist in Firestore (`users`, `admin_profiles`, `fellow_profiles`, `facilitator_profiles`).
- `Admin data missing`: validate admin credentials and Firestore read permissions.
- `Static asset not visible`: verify path and filename in `public/`.

---

## Contributing

1. Create a feature branch.
2. Keep changes scoped and documented.
3. Run `pnpm lint` and `pnpm build` before opening a PR.

---

## License

No license file is currently defined in this repository.
