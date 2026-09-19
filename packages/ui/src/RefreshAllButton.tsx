import { Button, CircularProgress, type SxProps, type Theme } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

export interface RefreshAllButtonProps {
  loading: boolean;
  disabled?: boolean;
  /** Appended as “Refresh all (n)”. Omit for a plain “Refresh all”. */
  count?: number;
  onRefresh: () => void;
  variant?: "contained" | "outlined";
  sx?: SxProps<Theme>;
}

/** Shared refresh-all button with built-in loading spinner (used by Search + Tracked views). */
export function RefreshAllButton({
  loading,
  disabled,
  count,
  onRefresh,
  variant = "contained",
  sx,
}: RefreshAllButtonProps) {
  return (
    <Button
      variant={variant}
      disabled={disabled || loading}
      onClick={onRefresh}
      sx={sx}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
    >
      {loading ? "Refreshing…" : count != null ? `Refresh all (${count})` : "Refresh all"}
    </Button>
  );
}
