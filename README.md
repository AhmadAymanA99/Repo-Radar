# Repo Radar

Search GitHub repositories, track favorites, and monitor stars / open issues / last commit — with per-repo refresh, independent loading & error states, localStorage persistence, and a stars bar chart.

**Stack:** React 19 + TypeScript · Zustand · MUI (+ MUI X Charts) · GitHub REST API · Vite · npm workspaces monorepo · Vercel.

## Features

- **Search tab** — debounced GitHub repo search (500ms, abort-safe, sorted by stars), paginated (12/page, up to GitHub's 1,000-result cap), track/untrack from any card, per-card ⟳ refresh, and a **Refresh all** button that re-runs the current search in a single request.
- **Tracked tab** — tracked repos with stars, open issues, last commit date, and last-refreshed timestamps; refresh one card or **Refresh all** (batched, per-repo states); stars bar chart with show/hide toggle (vertical bars on desktop, horizontal on mobile).
- **Loading UX** — structured card skeletons mirroring the real card layout (grid skeleton for page loads / bulk refresh), inline per-card error messages, error banners with retry, and error boundaries per view.
- **Extras** — light/dark theme toggle (persisted), typewriter hero heading, responsive layout (1 → 2 → 3 column grid), favicon.

## Monorepo layout

```
apps/web            # Dashboard app (Vite + React 19). Deployed to Vercel.
packages/github-api # Data layer: typed GitHub REST client, domain types, formatters
packages/store      # State layer: persisted Zustand tracked-repos store + useDebouncedValue
packages/ui         # Reusable components: RepoCard, SearchInput, RefreshAllButton,
                    #   PaginationControls, TypewriterText, ErrorBoundary, skeletons, feedback
packages/charts     # Plot package: StarsBarChart on MUI X Charts (lazy-loaded by the app)
```

Separation of concerns: `github-api` knows HTTP + types, `store` knows state + async orchestration, `ui`/`charts` are pure presentational, `web` composes views. Dependencies flow one way (`web → store/ui/charts → github-api`); each package declares its own dependencies.

## How this addresses the evaluation criteria

- **Monorepo structure and separation of concerns** — npm workspaces with `apps/web` (composition only) plus four packages; boundaries are enforced by the package manager (each package declares its own dependencies), not by folder convention.
- **Package for the UI** — `@repo/ui`: `RepoCard`, `SearchInput`, `RefreshAllButton`, `PaginationControls`, `TypewriterText`, `ErrorBoundary`, card/grid skeletons, loading/error/empty states. Both views compose exclusively from it — no view-local UI primitives.
- **Package for the needed plots** — `@repo/charts`: `StarsBarChart` (MUI X Charts) with compact tick formatting and responsive vertical/horizontal layouts. The app lazy-loads it, so plotting stays swappable without touching app code.
- **Reusable/shared components and packages** — the refresh-all button and pagination each exist once and are reused across Search + Tracked; formatters and domain types live in `@repo/github-api` and are shared by all consumers.
- **State and data-layer design** — the data layer (`@repo/github-api`: typed REST client, `GitHubRepo`/`TrackedRepo`) is separate from state (`@repo/store`: persisted Zustand store with a per-repo `status` map); views never call `fetch` directly.
- **Scalability and maintainability** — new views reuse existing packages; new data sources plug into `github-api` without touching state/UI; new plots go in `charts`; persisted schemas are versioned (`tracked-v1`).
- **Handling asynchronous operations cleanly** — debounced search with `AbortController` cancellation, bounded concurrency (3) for bulk refresh, `Promise.allSettled` so one failure never blocks others, per-repo loading/error states, and `AbortError` distinguished from real errors.
- **Code quality** — strict TypeScript with zero `any` in app code, no dead code, no secrets in the repo, per-package dependency declarations, error boundaries, and `prefers-reduced-motion` support.

## Setup

```bash
npm install
npm run dev --workspace=apps/web   # http://localhost:5173
npm run build --workspace=apps/web # production build → apps/web/dist
```

Optional — raise the GitHub rate limit (unauthenticated = 60 req/hour):

```bash
cp apps/web/.env.example apps/web/.env  # then set VITE_GITHUB_TOKEN
```

## Technical decisions & assumptions

- **Zustand + persist middleware** over Redux Toolkit: less boilerplate for a small domain; `partialize` persists only repo snapshots while transient loading/error states reset on reload.
- **Debounced search (500ms)** with `AbortController` cancellation so stale responses can never overwrite fresh ones (aborted requests in devtools are intentional; StrictMode double-fires effects in dev only).
- **Refresh one / all:** tracked `refreshOne`/`refreshAll` keep per-repo `{loading, error}` in a `status` map (batched with concurrency 3, failures isolated); search bulk-refresh re-runs the query (1 request for 12 results) and syncs tracked copies without extra calls.
- **Charts** stay behind `@repo/charts` and load lazily, cutting the initial bundle from ~800KB to ~257KB.
- **Types:** strict TS, shared `GitHubRepo`/`TrackedRepo` in `@repo/github-api`; no `any` in app code.

## Limitations

- Unauthenticated GitHub API: 60 requests/hour (search + refresh share the quota); rate-limit errors surface the reset time with a retry option.
- Search capped at GitHub's 1,000-result limit; each page turn costs one request.
- localStorage schemas (`repo-radar:tracked-v1`, `repo-radar:theme`); breaking type changes need a version bump.
