/** Shared GitHub domain types (subset of api.github.com payloads). */

export interface GitHubOwner {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  open_issues_count: number;
  pushed_at: string;
  updated_at: string;
  language: string | null;
  owner: GitHubOwner;
  default_branch: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: { name: string; date: string } | null;
    committer: { name: string; date: string } | null;
    message: string;
  };
  html_url: string;
}

/** Enriched repo snapshot stored for tracked repos. */
export interface TrackedRepo {
  fullName: string;
  repo: GitHubRepo;
  /** ISO date of the most recent commit (from /commits?per_page=1). Falls back to pushed_at. */
  lastCommitDate: string | null;
  lastRefreshedAt: string;
}

export interface SearchReposResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

export type RepoStatus = {
  loading: boolean;
  error: string | null;
};
