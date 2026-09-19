import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import BugReportIcon from "@mui/icons-material/BugReport";
import HistoryIcon from "@mui/icons-material/History";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import BookmarkRemoveIcon from "@mui/icons-material/BookmarkRemove";
import { formatDateTime, formatStars, timeAgo, type GitHubRepo } from "@repo/github-api";

export interface RepoCardProps {
  repo: GitHubRepo;
  /** Resolved last-commit ISO (falls back to pushed_at when null). */
  lastCommitDate?: string | null;
  tracked: boolean;
  refreshing?: boolean;
  refreshError?: string | null;
  lastRefreshedAt?: string | null;
  onTrack?: () => void;
  onUntrack?: () => void;
  onRefresh?: () => void;
}

export function RepoCard({
  repo,
  lastCommitDate,
  tracked,
  refreshing,
  refreshError,
  lastRefreshedAt,
  onTrack,
  onUntrack,
  onRefresh,
}: RepoCardProps) {
  const lastCommit = lastCommitDate ?? repo.pushed_at;
  return (
    <Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1 }}>
        <Box display="flex" gap={1.5} alignItems="flex-start">
          <Avatar src={repo.owner.avatar_url} alt={repo.owner.login} sx={{ width: 40, height: 40 }} />
          <Box minWidth={0} flex={1}>
            <Link
              href={repo.html_url}
              target="_blank"
              rel="noreferrer"
              underline="hover"
              fontWeight={600}
              sx={{ wordBreak: "break-all" }}
            >
              {repo.full_name}
              <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5, verticalAlign: "text-top" }} />
            </Link>
            <Typography
              variant="body2"
              color="text.secondary"
              title={repo.description ?? undefined}
              sx={{
                mt: 0.5,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {repo.description ?? "No description."}
            </Typography>
          </Box>
          {onRefresh ? (
            <Tooltip title="Refresh stats">
              <span>
                <IconButton size="small" onClick={onRefresh} disabled={refreshing} aria-label={`Refresh ${repo.full_name}`}>
                  {refreshing ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
          <Chip size="small" icon={<StarIcon />} label={`${formatStars(repo.stargazers_count)} stars`} />
          <Chip
            size="small"
            icon={<BugReportIcon />}
            label={`${repo.open_issues_count} open issues`}
          />
          <Tooltip title={formatDateTime(lastCommit)}>
            <Chip
              size="small"
              icon={<HistoryIcon />}
              label={`last commit ${timeAgo(lastCommit)}`}
            />
          </Tooltip>
          {repo.language ? <Chip size="small" label={repo.language} variant="outlined" /> : null}
        </Box>

        {refreshError ? (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            Refresh failed: {refreshError}
          </Typography>
        ) : null}
        {lastRefreshedAt ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            Updated {timeAgo(lastRefreshedAt)}
          </Typography>
        ) : null}
      </CardContent>
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        {tracked ? (
          <Button
            size="small"
            color="secondary"
            startIcon={<BookmarkRemoveIcon />}
            onClick={onUntrack}
          >
            Untrack
          </Button>
        ) : (
          <Button size="small" variant="contained" startIcon={<BookmarkAddIcon />} onClick={onTrack}>
            Track
          </Button>
        )}
      </CardActions>
    </Card>
  );
}
