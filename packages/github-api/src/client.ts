import type { GitHubRepo, SearchReposResult } from "./types.js";

const BASE = "https://api.github.com";
const ACCEPT = "application/vnd.github+json";

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = { Accept: ACCEPT };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

async function parseOrThrow(res: Response, url: string) {
  if (res.ok) return res.json();
  let detail = "";
  try {
    const body = await res.json();
    detail = (body as { message?: string }).message ?? "";
  } catch {
    /* ignore */
  }
  if (res.status === 403 && res.headers.get("x-ratelimit-remaining") === "0") {
    const reset = res.headers.get("x-ratelimit-reset");
    const when = reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : "later";
    throw new GitHubApiError(
      `GitHub rate limit exceeded. Try again after ${when}. ${detail}`.trim(),
      res.status,
    );
  }
  throw new GitHubApiError(
    `GitHub request failed (${res.status}) for ${url}. ${detail}`.trim(),
    res.status,
  );
}

export interface GitHubClientOptions {
  token?: string;
  /** For tests / SSR. */
  fetchFn?: typeof fetch;
}

export function createGitHubClient(opts: GitHubClientOptions = {}) {
  const doFetch = opts.fetchFn ?? fetch;
  const hdrs = headers(opts.token);

  return {
    async searchRepos(
      query: string,
      perPage = 12,
      page = 1,
      signal?: AbortSignal,
    ): Promise<SearchReposResult> {
      const url = `${BASE}/search/repositories?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&sort=stars&order=desc`;
      const res = await doFetch(url, { headers: hdrs, signal });
      return parseOrThrow(res, url);
    },

    async getRepo(fullName: string, signal?: AbortSignal): Promise<GitHubRepo> {
      const url = `${BASE}/repos/${fullName}`;
      const res = await doFetch(url, { headers: hdrs, signal });
      return parseOrThrow(res, url);
    },

    /** Fetch repo details. Last-commit display uses pushed_at (no extra /commits call, by design). */
    async getRepoSnapshot(
      fullName: string,
      signal?: AbortSignal,
    ): Promise<{ repo: GitHubRepo; lastCommitDate: string | null }> {
      const repo = await this.getRepo(fullName, signal);
      return { repo, lastCommitDate: repo.pushed_at ?? null };
    },
  };
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;

/** Default unauthenticated client (60 req/hour). Set VITE_GITHUB_TOKEN to raise the limit. */
export const github = createGitHubClient({
  token: typeof import.meta !== "undefined" ? (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GITHUB_TOKEN : undefined,
});
