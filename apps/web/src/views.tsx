import { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
// Lazy: @mui/x-charts is the heaviest dependency — keep it out of the initial bundle.
const StarsBarChart = lazy(() =>
  import("@repo/charts").then((m) => ({ default: m.StarsBarChart })),
);
import { github, type GitHubRepo, type TrackedRepo } from "@repo/github-api";
import { useDebouncedValue, useRepoStore } from "@repo/store";
import {
  EmptyState,
  ErrorState,
  PaginationControls,
  RefreshAllButton,
  RepoCard,
  RepoCardSkeleton,
  RepoGridSkeleton,
  SearchInput,
} from "@repo/ui";

export function SearchView() {
  const PER_PAGE = 12;
  /** GitHub caps search results at 1,000 regardless of total_count. */
  const MAX_RESULTS = 1000;
  const [query, setQuery] = useState("react dashboard");
  const debounced = useDebouncedValue(query, 500);
  const [results, setResults] = useState<GitHubRepo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(Math.min(total, MAX_RESULTS) / PER_PAGE));

  const track = useRepoStore((s) => s.track);
  const untrack = useRepoStore((s) => s.untrack);
  const tracked = useRepoStore((s) => s.tracked);
  // Independent loading/error per search result (keyed by lower-cased full_name).
  const [refreshStatus, setRefreshStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({});
  // Last-commit dates (pushed_at) resolved per result on refresh.
  const [commitDates, setCommitDates] = useState<Record<string, string | null>>({});

  const refreshResult = async (fullName: string) => {
    const k = fullName.toLowerCase();
    setRefreshStatus((s) => ({ ...s, [k]: { loading: true, error: null } }));
    try {
      const { repo, lastCommitDate } = await github.getRepoSnapshot(fullName);
      const snap: TrackedRepo = {
        fullName: repo.full_name,
        repo,
        lastCommitDate,
        lastRefreshedAt: new Date().toISOString(),
      };
      setResults((prev) => prev.map((r) => (r.full_name.toLowerCase() === k ? repo : r)));
      setCommitDates((prev) => ({ ...prev, [k]: lastCommitDate }));
      // Keep the tracked copy in sync when this repo is tracked.
      const st = useRepoStore.getState();
      if (st.isTracked(fullName)) st.upsertSnapshot(snap);
      setRefreshStatus((s) => ({ ...s, [k]: { loading: false, error: null } }));
    } catch (e: unknown) {
      setRefreshStatus((s) => ({
        ...s,
        [k]: { loading: false, error: e instanceof Error ? e.message : "Refresh failed." },
      }));
    }
  };

  const [refreshingAll, setRefreshingAll] = useState(false);
  const bulkCtrl = useRef<AbortController | null>(null);

  // Bulk refresh = re-run the current search (one request for all visible
  // results), not N per-repo calls. Single-card refresh still uses per-repo
  // fetch via refreshResult.
  const refreshAllResults = async () => {
    if (results.length === 0 || refreshingAll) return;
    bulkCtrl.current?.abort();
    const ctrl = new AbortController();
    bulkCtrl.current = ctrl;
    setRefreshingAll(true);
    setError(null);
    try {
      const r = await github.searchRepos(debounced.trim(), PER_PAGE, page, ctrl.signal);
      if (ctrl.signal.aborted) return;
      setResults(r.items);
      setTotal(r.total_count);
      setCommitDates({});
      // Keep tracked copies in sync without extra requests.
      const st = useRepoStore.getState();
      const now = new Date().toISOString();
      for (const repo of r.items) {
        if (st.isTracked(repo.full_name)) {
          st.upsertSnapshot({
            fullName: repo.full_name,
            repo,
            lastCommitDate: repo.pushed_at ?? null,
            lastRefreshedAt: now,
          });
        }
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Refresh failed.");
    } finally {
      if (bulkCtrl.current === ctrl) bulkCtrl.current = null;
      setRefreshingAll(false);
    }
  };

  // New query → back to page 1. The fetch effect below aborts any in-flight
  // request, so the stale-page fetch is cancelled, not duplicated.
  useEffect(() => {
    setPage(1);
  }, [debounced]);

  useEffect(() => {
    const q = debounced.trim();
    // A new search supersedes any in-flight bulk refresh.
    bulkCtrl.current?.abort();
    if (!q) {
      setResults([]);
      setTotal(0);
      setError(null);
      setLoading(false);
      return;
    }
    // AbortController cancels any in-flight search when the query changes (or
    // the effect re-runs). The "canceled" entry you see in devtools is that
    // cancellation working as intended — it prevents stale results from
    // overwriting fresh ones. Note: React StrictMode double-invokes effects in
    // development, so the very first search on page load fires twice with the
    // first copy aborted; production builds run the effect once.
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    github
      .searchRepos(q, PER_PAGE, page, ctrl.signal)
      .then((r) => {
        setResults(r.items);
        setTotal(r.total_count);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Search failed.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [debounced, page]);

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Box
        display="flex"
        gap={2}
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
      >
        <Box flex={1} minWidth={0}>
          <SearchInput value={query} onChange={setQuery} loading={loading} />
        </Box>
        <RefreshAllButton
          variant="outlined"
          loading={refreshingAll}
          disabled={loading || results.length === 0}
          count={results.length}
          onRefresh={() => void refreshAllResults()}
          sx={{ whiteSpace: "nowrap", height: { sm: 56 } }}
        />
      </Box>

      {loading && results.length === 0 ? <RepoGridSkeleton count={6} /> : null}
      {error ? <ErrorState message={error} onRetry={() => setQuery((q) => `${q} `)} /> : null}

      {!loading && !error && debounced.trim() && results.length === 0 ? (
        <EmptyState title="No repositories found" hint="Try a different search term." />
      ) : null}

      {results.length > 0 ? (
        <>
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
            ref={resultsRef}
            sx={{ scrollMarginTop: 80 }}
          >
            {loading ? <CircularProgress size={16} /> : null}
            <Typography variant="body2" color="text.secondary">
              Showing {(page - 1) * PER_PAGE + 1}–{(page - 1) * PER_PAGE + results.length}
              {total ? ` of ${Math.min(total, MAX_RESULTS).toLocaleString()}` : ""} for
              “{debounced.trim()}”
            </Typography>
          </Box>
          {loading || refreshingAll ? (
            <RepoGridSkeleton count={6} />
          ) : (
            <>
              <Grid container spacing={2}>
                {results.map((repo) => {
                  const isTracked = repo.full_name.toLowerCase() in tracked;
                  const st = refreshStatus[repo.full_name.toLowerCase()];
                  const refreshing = st?.loading ?? false;
                  return (
                    <Grid key={repo.id} size={{ xs: 12, md: 6, lg: 4 }}>
                      {refreshing ? (
                        <RepoCardSkeleton />
                      ) : (
                    <RepoCard
                      repo={repo}
                      lastCommitDate={commitDates[repo.full_name.toLowerCase()]}
                      tracked={isTracked}
                      refreshError={st?.error}
                      onTrack={() => track(repo)}
                      onUntrack={() => untrack(repo.full_name)}
                      onRefresh={() => void refreshResult(repo.full_name)}
                    />
                      )}
                    </Grid>
                  );
                })}
              </Grid>
              <PaginationControls
                page={page}
                totalPages={totalPages}
                loading={loading}
                onPrev={() => {
                  setPage((p) => Math.max(1, p - 1));
                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                onNext={() => {
                  setPage((p) => p + 1);
                  resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              />
            </>
          )}
        </>
      ) : null}

      {!debounced.trim() ? (
        <EmptyState title="Search GitHub" hint="Type above to find repositories to track." />
      ) : null}
    </Box>
  );
}

export function TrackedView() {
  const trackedMap = useRepoStore((s) => s.tracked);
  const status = useRepoStore((s) => s.status);
  const globalError = useRepoStore((s) => s.globalError);
  const untrack = useRepoStore((s) => s.untrack);
  const refreshOne = useRepoStore((s) => s.refreshOne);
  const refreshAll = useRepoStore((s) => s.refreshAll);
  const [showChart, setShowChart] = useState(true);

  const list = Object.values(trackedMap).sort(
    (a, b) => b.repo.stargazers_count - a.repo.stargazers_count,
  );
  const refreshingAll = list.length > 0 && list.every((t) => status[t.fullName.toLowerCase()]?.loading);
  const anyRefreshing = Object.values(status).some((s) => s.loading);

  if (list.length === 0) {
    return (
      <EmptyState
        title="No tracked repositories yet"
        hint="Search for repos and press “Track” to monitor them here."
      />
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" gap={1} flexWrap="wrap">
        <RefreshAllButton
          loading={anyRefreshing}
          disabled={anyRefreshing}
          count={list.length}
          onRefresh={() => void refreshAll()}
        />
        <Button
          variant="outlined"
          startIcon={showChart ? <VisibilityOffIcon /> : <VisibilityIcon />}
          onClick={() => setShowChart((v) => !v)}
        >
          {showChart ? "Hide chart" : "Show chart"}
        </Button>
      </Box>

      {globalError ? <Alert severity="warning">{globalError}</Alert> : null}

      {showChart ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Suspense fallback={<RepoGridSkeleton count={2} />}>
            <StarsBarChart repos={list} />
          </Suspense>
        </Paper>
      ) : null}

      <Grid container spacing={2}>
        {list.map((t) => {
          const st = status[t.fullName.toLowerCase()];
          const refreshing = st?.loading ?? false;
          return (
            <Grid key={t.fullName} size={{ xs: 12, md: 6, lg: 4 }}>
              {refreshing ? (
                <RepoCardSkeleton />
              ) : (
                <RepoCard
                  repo={t.repo}
                  lastCommitDate={t.lastCommitDate}
                  lastRefreshedAt={t.lastRefreshedAt}
                  tracked
                  refreshError={st?.error}
                  onUntrack={() => untrack(t.fullName)}
                  onRefresh={() => void refreshOne(t.fullName)}
                />
              )}
            </Grid>
          );
        })}
      </Grid>
      {refreshingAll ? <Typography variant="caption">Refreshing all…</Typography> : null}
    </Box>
  );
}
