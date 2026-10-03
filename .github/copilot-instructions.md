# ShuzhFit: Copilot Instructions

Save this file as `.github/copilot-instructions.md` in the repo root. Copilot reads it automatically in every chat.

## Project
ShuzhFit is a fitness website plus a personalized workout, nutrition and progress tracker. It is being migrated from PHP + MySQL to a stack that deploys on Vercel. The brand is tied to the owner's YouTube channel: https://www.youtube.com/@ShuzhFit

## Stack (do not deviate without asking)
- Vite + React 18 + TypeScript (strict) + React Router v6
- Backend: Vercel serverless functions in `/api` (TypeScript, Node runtime)
- Database: Neon Postgres + Drizzle ORM + drizzle-kit migrations
- Auth: email/password, bcryptjs, JWT (`jose`) in an httpOnly, Secure, SameSite=Lax cookie. Roles: `user` | `admin`
- Validation: zod on every API input
- Data fetching: TanStack Query
- Sanitizing admin HTML: DOMPurify
- Styling: plain CSS with design tokens in `src/styles/tokens.css`. No Tailwind, no component library.
- Approved extra dependencies: `@fontsource/anton`, `@fontsource/inter`, `@fontsource/space-mono`, `lucide-react`, `react-helmet-async`, `vitest`, `@playwright/test`. Ask before adding anything else.

## Code rules
- No `any`. Share types between `/api` and `/src` through `/shared`.
- Keep components small and typed. Prefer boring, readable code.
- Secrets only via env vars (`DATABASE_URL`, `JWT_SECRET`, `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `ADMIN_EMAIL`). Document them in `.env.example`. Fail loudly if `JWT_SECRET` is missing.
- Every mutating endpoint: requires auth, checks ownership (`WHERE id = ? AND user_id = ?`), validates with zod, uses Drizzle parameterized queries only, accepts JSON only, and rejects a mismatched `Origin`.
- Login `next` redirects must be same-origin relative paths only (reject `//`, `\`, absolute URLs).
- Search uses `ILIKE`, parameterized, with `%` and `_` escaped.
- Admin-authored HTML is sanitized on save and on render. Comments are rendered as plain text.
- One shared calorie/BMR calculation module is used everywhere (nutrition log, BMI page, onboarding).

## Design system (from the YouTube channel)
- Colors (tokens): `--bg #242424` (charcoal, never pure black), `--surface #2E2E2E`, `--surface-2 #383838`, `--border rgba(255,255,255,.10)`, `--text #F4F1EA`, `--muted #B9B6AE`, `--brand #FF5A36` (match the channel banner), `--paper #F4F1EA`, `--ink #1B1B1B`.
- Orange is for primary actions and highlights only.
- Fonts: Anton for headings (uppercase, letter-spacing), Inter for body, Space Mono for labels, taglines and stat captions.
- Motifs: orange paint-splatter SVG edges (use sparingly), white "tape label" badges with mono text, real channel thumbnails as imagery.
- Alternate section variants on public pages: dark, light (paper), brand (orange) for depth and contrast.
- Every page uses a centered `Container` (max-width 1200). No page may be plain text on a dark background. Use cards, icons and media.
- Accessibility: WCAG AA contrast, visible focus states, 44px minimum tap targets, respect `prefers-reduced-motion`. Breakpoints: 640 / 900 / 1200.
- Before using a CSS class in a component, confirm the rule exists. Unstyled markup is a bug.

## Removed on purpose (do not re-add)
- The "Daily Motivation" quote card, the "New Quote" button and its JS.
- The `/motivation` page (redirect to `/`).
- Placeholder or non-owner YouTube video IDs anywhere in the DB or seeds.

## YouTube integration
- The channel feed is the source of truth. The `videos` table is only an optional override that pins a video to an exercise.
- Order of sources: YouTube Data API v3, then the channel RSS feed, then a static list in `/shared/fallbackVideos.ts`. The UI must never show "Video unavailable".
- Cache API responses with `s-maxage=3600, stale-while-revalidate=86400`.
- Lite embeds only: show the thumbnail first, load the `youtube-nocookie.com` iframe after click. Always include a "Watch on YouTube" link with `rel="noopener noreferrer"`.
- Shorts use a vertical 9:16 modal.

## Public vs. app layout
- Public site: sticky header (Home, Workouts, Videos, Blog, My Journey, Nutrition, Search, Log in, Get Started), full footer.
- Logged-in app: separate shell. Desktop sidebar and mobile bottom tab bar with Today, Train, Food, Progress, Profile. The public header is not shown inside the app. No dropdown user menu.
- A logged-in user is guided, not handed forms:
  1. Onboarding (goal, experience, days per week, equipment, age, sex, height, weight, target weight)
  2. Auto-generated weekly plan (2-3 days Full Body, 4 days Upper/Lower, 5-6 days Push/Pull/Legs)
  3. A "Today" screen showing the planned workout with one big Start button
  4. Logger pre-filled from the plan and last session, progressive-overload suggestions (2.5 kg upper, 5 kg lower), rest timer, PR banner
  5. Adaptation: missed 2+ sessions suggests a shorter workout, and a 14-day weight stall suggests a calorie adjustment (user accepts or dismisses)

## Process
- Work in phases. After each phase: list files changed, say how to run and verify, then wait for "continue".
- Do not delete existing features without saying so. Keep PHP originals in `/legacy-php` until the owner confirms.
- Keep copy short, plain and motivating. No clichés, no quote widgets.
