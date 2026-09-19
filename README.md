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
