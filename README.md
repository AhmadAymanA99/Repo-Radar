# Repo Radar

Search GitHub repositories, track favorites, and monitor stars / open issues / last commit — with per-repo refresh, independent loading & error states, localStorage persistence, and a stars bar chart.

**Stack:** React 19 + TypeScript · Zustand · MUI (+ MUI X Charts) · GitHub REST API · Vite · npm workspaces monorepo · Vercel.

## Monorepo layout

```
apps/web            # Dashboard app (Vite + React 19). Deployed to Vercel.
packages/github-api # Data layer: typed GitHub REST client, domain types, formatters
packages/store      # State layer: Zustand tracked-repos store (persisted) + hooks (debounce, async)
packages/ui         # Reusable presentational components (RepoCard, SearchInput, Loading/Error/Empty)
packages/charts     # Plot package (StarsBarChart on MUI X Charts)
```

Separation of concerns: `github-api` knows HTTP + types, `store` knows state + async orchestration, `ui`/`charts` are pure presentational, `web` composes pages/views. No package imports from `web`; dependencies flow one way (`web → store/ui/charts → github-api`).

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

## Deploy on Vercel

- Import this repo, Vercel auto-detects `vercel.json`:
  - Build: `npm run build --workspace=apps/web`
  - Output: `apps/web/dist`
- Add env var `VITE_GITHUB_TOKEN` (optional) in Vercel dashboard.

## Technical decisions & assumptions

- **Zustand + persist middleware** over Redux Toolkit: less boilerplate for a small domain, per-repo status map is trivial, `partialize` persists only snapshots (transient loading/error states reset on reload).
- **Debounced search (500ms)** with `AbortController` cancellation to avoid race conditions; sort by stars.
- **Last commit date** = the repo's `pushed_at` from the repo payload — no extra `/commits` call, keeping refreshes to one request per repo.
- **Refresh one / all:** `refreshOne` sets per-repo `{loading, error}`; `refreshAll` batches with concurrency 3 to respect rate limits, collects first error into `globalError` without blocking other repos.
- **Independent states:** `status: Record<fullName, {loading, error}>` — one repo's failure never affects others.
- **Charts package** wraps MUI X Charts so plotting stays swappable without touching the app.
- **Types:** strict TS, shared `GitHubRepo`/`TrackedRepo` in `@repo/github-api`; no `any` in app code.

## Limitations

- Unauthenticated GitHub API: 60 requests/hour (search + refresh share the quota); rate-limit message surfaces remaining reset time.
- Search is paginated (12 per page, up to GitHub's 1,000-result cap); each page turn costs one API request.- localStorage schema `repo-radar:tracked-v1`; breaking type changes need a version bump.
