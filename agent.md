# Leadership Development – Theme & Consistency Guide

## Brand DNA
- **Voice**: Executive, confident, and constructive. Favor short declarative sentences that highlight outcomes and credibility.
- **Tone**: Encouraging but direct. Celebrate momentum ("next milestone") instead of hype.
- **Iconography**: Default to `lucide-react` with thin strokes. Reuse `BrandLogo` wherever the brand mark is needed—never rebuild the workflow icon manually.

## Color System
| Token | Hex | Usage |
| --- | --- | --- |
| `--background` | `#F9F7F2` | Default page background |
| `--primary` | `#1A3636` | Headlines, primary CTAs, icon fills |
| `--accent` | `#D6AD60` | Emphasis, pill highlights |
| `--foreground` | `#1A3636` (light) / `#F9F7F2` (dark) | Body text |
| Support tones | Slate 400–700 | Secondary copy, borders |

Guidelines:
1. Keep contrast ≥ 4.5:1 on body text. Use accent sparingly for emphasis or data points.
2. Buttons: default variant = solid primary background; secondary actions use outline with subtle hover fills.
3. Background blocks should use tonal layering (white → slate-50 → accent tint) rather than gradients unless it is a hero/CTA moment.

## Typography
- **Sans**: Inter (`--font-sans`) for UI and paragraphs.
- **Display**: DM Serif Display (`--font-display`) for large headlines.
- **Utility**: Manrope (loaded per-page) only for hero/login typography to preserve the reference design. Avoid introducing new families.
- Letter-spacing: uppercase labels should use `tracking-[0.3em]` for signature look.

## Layout & Spacing
- Container widths: `max-w-6xl` or `max-w-7xl` depending on section density.
- Vertical rhythm: multiples of `py-12` for standard sections; `py-20+` reserved for hero or CTA.
- Cards: `rounded-2xl`, `border-slate-100`, shadow-sm; dark mode uses `dark:bg-slate-900/60`.
- Route grouping: Use `(portal)` layout for gated/workflow pages (login, get-started) so they inherit header/footer/background automatically.

## Components
- **BrandLogo**: Use instead of ad-hoc logos. Props allow `label="full"`, `showTagline`, and `stacked` variations.
- **Buttons**: Always import from `@/components/ui/button`; wrap `Link` children via `asChild` for routing.
- **Footer**: Keep the simplified status pill and link cluster; avoid reintroducing multi-column footers unless explicitly required.
- **Status Badges**: Use `inline-flex`, pill border, and emerald dot to signal live systems.

## Content Consistency
- Calls-to-action should map to existing routes: `Start Training` → `/get-started`, `Log In` → `/login`.
- Use shared constants from `@/lib/constants` for brand copy and partner URLs.
- When referencing I-Capital Africa, link to `CONTACT_LINKS.icapitalForm` or `CONTACT_LINKS.partnershipEmail`.

## Accessibility & Motion
- Focus rings: rely on default button variants; do not remove outlines.
- Hover states must include color and (optionally) scale changes, never rotation unless it reinforces the story (e.g., hero mock card).
- Provide descriptive `alt` text for every `Image` component, focusing on scenario context ("Executive dashboard visualization").

## File & Content Practices
- Keep marketing page components under `src/components/shared/`.
- Store reusable data in `src/lib/constants/index.ts` (e.g., brand info, partner links).
- For future theme tweaks, edit `src/app/globals.css` tokens first, then layer component-specific overrides.

Following this guide keeps every surface—marketing site, portal entry, and future dashboards—visually cohesive and aligned with Leadership Development's executive identity.

---

# Product Flow & PSD Outline (Draft)

## Experience Map (User Flow)
1. **Landing → Login**
   - Primary entry at `/` explains the full system: program value, cohort structure, competency lifecycle, and evaluation loop.
   - CTA buttons: **Start Training** (`/get-started`), **Log In** (`/login`).
2. **Login → Role Routing (Static JSON)**
   - Login uses `LOGIN_PROFILES` (JSON constants) to route users:
     - `admin` → `/admin`
     - `fellow` with `companyId` → `/fellow/[companyId]`
3. **Admin Dashboard**
   - Overview: companies onboarded, fellows enrolled, cohorts active, engagement and performance.
   - Navigation: Dashboard, Companies, Competencies, Fellows, Portfolio Evaluation, Quiz Evaluation, Examinations, Reports.
4. **Fellow Dashboard**
   - Company-branded workspace with competency list and progress pipeline.
   - Competency flow: **Believe → Know → Do** (unlock rules by completion + quiz pass).

## Landing Page PSD (Content Blocks)
- **Hero**: “Leadership Development Design Lab” + subheading with executive tone.
- **Program Narrative**: the full training system (companies → fellows → competency loop → evaluation).
- **Competency Lifecycle**: visual step cards: Believe → Know → Do → Portfolio Review → Mastery.
- **Outcomes & Metrics**: impact stats, partner quotes, and cohort readiness.
- **CTA Section**: Start Training + Log In.

## Admin Dashboard PSD (Layout + Modules)
- **Left Sidebar** with management tabs:
  - Dashboard
  - Companies
  - Competencies
  - Fellows Managment(creating fellow under company)
  - Portfolio Evaluation 
  - Quiz Evaluation
  - Examinations
  - Performance
- **Dashboard Overview**
  - Cards: Active companies, fellows, cohorts, engagement rate, completion rate.
  - Charts: performance by cohort, competency coverage.
- **Companies**
  - CRUD table with status, cohort, readiness.
- **Competencies**
  - CRUD for competencies and behavioral indicators (min 4 per competency).
- **Fellows**
  - Full roster, filters, cohort placement.
- **Evaluation**
  - Portfolio review queue + rubric summary.
  - Quiz performance with pass thresholds.
- **Examinations**
  - Exam creation + assignment.

## Fellow Dashboard PSD (Layout + Modules)
- **Company Dashboard**
  - Company metrics, cohort calendar, next tasks.
- **Competencies (Accordion)**
  - First competency open by default, others collapsed.
  - Each competency has **Believe / Know / Do** tabs.
- **Believe**
  - Tabs: Video + Article.
  - Completion unlocks quiz.
- **Know**
  - Tabs: Video + Article.
  - Quiz unlocks only after content completion, pass threshold = **80%**.
- **Do**
  - Task-only (no video/article).
  - Build **3 STAR portfolios** + evidence attachment.
  - Submit one for review per behavioral indicator.
- **Performance**
  - Progress, mastery indicator, quiz pass history.

## Rules & Gates
- A competency contains **≥ 4 behavioral indicators**.
- Each indicator must follow **Believe → Know → Do**.
- Quizzes unlock after content completion.
- Pass threshold for all quizzes: **80%**.
- “Do” phase requires 3 STAR portfolios with evidence.