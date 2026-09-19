import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { github, type GitHubRepo, type TrackedRepo } from "@repo/github-api";

export interface TrackedState {
  /** Keyed by lower-cased full_name for case-insensitive lookup. */
  tracked: Record<string, TrackedRepo>;
  /** Independent loading / error state per repo (keyed by lower-cased full_name). */
  status: Record<string, { loading: boolean; error: string | null }>;
  globalError: string | null;

  isTracked: (fullName: string) => boolean;
  track: (repo: GitHubRepo) => void;
  untrack: (fullName: string) => void;
  refreshOne: (fullName: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  /** Replace the stored snapshot (only if the repo is already tracked). */
  upsertSnapshot: (snap: TrackedRepo) => void;
}

const key = (fullName: string) => fullName.toLowerCase();

function errMsg(e: unknown): string {
  if (e instanceof Error) {
    if (e.name === "AbortError") return "Request was cancelled.";
    return e.message;
  }
  return "Something went wrong.";
}

async function snapshot(fullName: string, signal?: AbortSignal): Promise<TrackedRepo> {
  const { repo, lastCommitDate } = await github.getRepoSnapshot(fullName, signal);
  return {
    fullName: repo.full_name,
    repo,
    lastCommitDate,
    lastRefreshedAt: new Date().toISOString(),
  };
}

export const useRepoStore = create<TrackedState>()(
  persist(
    (set, get) => ({
      tracked: {},
      status: {},
      globalError: null,

      isTracked: (fullName) => key(fullName) in get().tracked,

      track: (repo) =>
        set((s) => {
          const k = key(repo.full_name);
          if (k in s.tracked) return s;
          // Seed immediately from search payload so the UI is instant.
          // lastCommitDate is the repo's pushed_at (no extra /commits call, by design).
          const seeded: TrackedRepo = {
            fullName: repo.full_name,
            repo,
            lastCommitDate: repo.pushed_at ?? null,
            lastRefreshedAt: new Date().toISOString(),
          };
          return { tracked: { ...s.tracked, [k]: seeded } };
        }),

      untrack: (fullName) =>
        set((s) => {
          const k = key(fullName);
          if (!(k in s.tracked)) return s;
          const { [k]: _removed, ...rest } = s.tracked;
          const { [k]: _s, ...restStatus } = s.status;
          return { tracked: rest, status: restStatus };
        }),

      refreshOne: async (fullName) => {
        const k = key(fullName);
        set((s) => ({ status: { ...s.status, [k]: { loading: true, error: null } } }));
        try {
          const snap = await snapshot(fullName);
          set((s) => ({
            tracked: { ...s.tracked, [k]: snap },
            status: { ...s.status, [k]: { loading: false, error: null } },
          }));
        } catch (e) {
          set((s) => ({
            status: { ...s.status, [k]: { loading: false, error: errMsg(e) } },
          }));
        }
      },

      refreshAll: async () => {
        const names = Object.values(get().tracked).map((t) => t.fullName);
        if (names.length === 0) return;
        set((s) => {
          const status = { ...s.status };
          for (const n of names) status[key(n)] = { loading: true, error: null };
          return { status, globalError: null };
        });
        // Bounded concurrency to stay friendly to the unauthenticated rate limit.
        const CONCURRENCY = 3;
        let firstError: string | null = null;
        for (let i = 0; i < names.length; i += CONCURRENCY) {
          const batch = names.slice(i, i + CONCURRENCY);
          const results = await Promise.allSettled(batch.map((n) => snapshot(n)));
          set((s) => {
            const tracked = { ...s.tracked };
            const status = { ...s.status };
            results.forEach((r, idx) => {
              const k = key(batch[idx]);
              if (r.status === "fulfilled") {
                tracked[k] = r.value;
                status[k] = { loading: false, error: null };
              } else {
                const msg = errMsg(r.reason);
                status[k] = { loading: false, error: msg };
                firstError ??= msg;
              }
            });
            return { tracked, status };
          });
        }
        if (firstError) set({ globalError: firstError });
      },

      upsertSnapshot: (snap) =>
        set((s) => {
          const k = key(snap.fullName);
          if (!(k in s.tracked)) return s;
          return { tracked: { ...s.tracked, [k]: snap } };
        }),
    }),
    {
      name: "repo-radar:tracked-v1",
      storage: createJSONStorage(() => localStorage),
      // Persist only the tracked snapshots; transient status is re-initialised.
      partialize: (s) => ({ tracked: s.tracked }) as TrackedState,
    },
  ),
);
