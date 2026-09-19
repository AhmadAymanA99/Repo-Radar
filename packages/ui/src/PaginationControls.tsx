import { Box, Button, Typography } from "@mui/material";

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
}

/** Shared Previous / Page x of y / Next controls. */
export function PaginationControls({
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
      <Button variant="outlined" size="small" disabled={page <= 1 || loading} onClick={onPrev}>
        Previous
      </Button>
      <Typography variant="body2" color="text.secondary">
        Page {Math.min(page, totalPages)} of {totalPages.toLocaleString()}
      </Typography>
      <Button
        variant="outlined"
        size="small"
        disabled={page >= totalPages || loading}
        onClick={onNext}
      >
        Next
      </Button>
    </Box>
  );
}
