# CaliQuest

Gamified calisthenics web app. Next.js (App Router, TypeScript) + Supabase (Postgres, auth) + Tailwind CSS v4, deployed on AWS Amplify.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (use this to type-check; there is no separate typecheck script)
- `npm run lint` — eslint
- `npm test` — run the test suite once (Vitest); `npm run test:watch` for watch mode, `npm run test:coverage` for a coverage report

## Architecture

- `src/app` — App Router pages. `(app)` group = authenticated app shell (header + mobile bottom nav), `(auth)` = login/signup. Server components fetch data; mutations go through server actions (`actions.ts` next to the page).
- `src/lib/services` — business logic; `src/lib/repositories` — Supabase queries; `src/lib/supabase` — client/server Supabase factories.
- `src/components` — client components, grouped by feature.
- `supabase/schema.sql` + `seed.sql` — database schema and seed data.

## Testing

Vitest + React Testing Library, run in a jsdom environment. Config is `vitest.config.mts`; shared setup (jest-dom matchers, RTL auto-cleanup) is `src/test/setup.ts`. A GitHub Actions workflow (`.github/workflows/test.yml`) runs the suite and a production build on every push/PR to `main`.

- **Repositories** (`src/lib/repositories`): pass a mocked `SupabaseClient` (see `src/test/helpers/supabase-mock.ts` — `createSupabaseMock()` + `createQueryBuilder({ data, error })`) and assert the right table/filters were used and errors propagate. See `squads.repository.test.ts`.
- **Services** (`src/lib/services`): `vi.mock('@/lib/supabase/server')` and `vi.mock(...)` the repository modules the service imports, then assert on the business rules (which sentinel `Error` is thrown, what gets passed to the repository). See `squads.service.test.ts`, `skills.service.test.ts`. For services calling an external SDK (Anthropic/OpenAI), mock the SDK module itself — see `voice-workout-parsing.service.test.ts`.
- **Components** (`src/components`): `vi.mock('next/navigation')` and the page's `actions.ts` module, render with `@testing-library/react`, drive interactions with `@testing-library/user-event`. See `SkillCard.test.tsx`, `CreateSquadForm.test.tsx`.
- Pure logic (`src/lib/xp.ts`, `src/lib/avatar.ts`, etc.) needs no mocking — test it directly.

Co-locate new test files next to the code under test as `<name>.test.ts(x)`.

## Logging (required)

Use the shared pino logger (`src/lib/logger.ts`) — never `console.log`. Any new server action or service function that mutates data, calls an external API, or matters for debugging/support must log:

1. **Scope a child logger** at the top: `logger.child({ userId, feature: '<feature-name>', ...relevantIds })` (e.g. `squadId`).
2. **`.info(...)` on success** — the ids/counts that matter, e.g. `log.info({ squadId }, 'Squad created')`.
3. **`.warn(...)` for expected/handled failures** — validation errors, permission checks, business-rule rejections (e.g. `NOT_LEADER`, `ALREADY_IN_SQUAD`).
4. **`.error({ err }, ...)` for unexpected failures** — thrown errors, failed external calls. Pass the error under the `err` key so pino's error serializer formats it (`serializers: { err: pino.stdSerializers.err }` in `logger.ts`).
5. **Never log full user-authored content** (post text, chat messages, etc.) — log length or other metadata instead.

Reference implementations: `src/app/(app)/squads/actions.ts` (action-layer logging with a shared `logActionOutcome` helper), `src/lib/services/guru.service.ts` and `src/lib/services/quest-generation.service.ts` (service-layer logging around LLM calls).

## Mobile-first development (required)

CaliQuest is used primarily **on a phone, in the gym**. Every UI change must be designed for mobile first and verified at a 375px-wide viewport before considering desktop. Concretely:

1. **Layout**: style for the narrow viewport by default; add `sm:`/`md:`/`lg:` variants to enhance for larger screens — never the reverse. No fixed pixel widths on containers; wide content (tables, trees, charts) scrolls horizontally in its own `overflow-x-auto` wrapper (see `SkillsTree` for the edge-bleed pattern: `-mx-4 px-4 md:mx-0 md:px-0`).
2. **The fixed bottom nav** (`src/app/(app)/layout.tsx`) overlays the bottom ~4rem on mobile. Page content already gets `pb-24 md:pb-6` from the layout — don't add fixed-bottom elements inside pages without accounting for it.
3. **Safe areas**: the viewport uses `viewport-fit=cover`. Any new fixed/sticky bar at the top or bottom of the screen must pad with `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` (see the app layout and `OnboardingFlow` action bar).
4. **Touch targets**: interactive elements need a ≥44×44px hit area. For visually small icon buttons, expand the hit area with padding + negative margin (`p-2.5 -m-2.5`) instead of growing the visual size.
5. **Inputs**: `globals.css` forces 16px font on inputs for coarse pointers (stops iOS focus auto-zoom) — don't undo it, and don't set input text below `text-base` expecting it to render that way on phones. Always set the right `inputMode`/`type` (`inputMode="numeric"` for reps/seconds) so the correct mobile keyboard opens.
6. **No hover-only affordances**: anything revealed on `hover:` must also be reachable by tap (visible by default on mobile or behind an explicit toggle). Hover styles are fine as enhancement only.
7. **Performance**: assume mid-range phones on gym wifi. Lazy-load heavy client-only components with `next/dynamic` + `ssr: false` (see `FlexAvatar`/three.js), and keep new heavy dependencies out of the initial bundle.
8. **Verify before finishing**: check changed screens at 375px (portrait phone), 768px, and desktop widths. Watch specifically for horizontal page overflow, content hidden behind the bottom nav, and tap targets that are hard to hit.
