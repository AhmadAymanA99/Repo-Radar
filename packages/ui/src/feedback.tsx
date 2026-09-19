import { Alert, Box, Button, Card, CardActions, CardContent, Grid, Skeleton, Typography } from "@mui/material";

/** Skeleton placeholder that mirrors the RepoCard layout (used while a card refreshes). */
export function RepoCardSkeleton() {
  return (
    <Card variant="outlined" sx={{ height: "100%" }} aria-hidden="true">
      <CardContent>
        <Box display="flex" gap={1.5} alignItems="flex-start">
          <Skeleton variant="circular" width={40} height={40} sx={{ flexShrink: 0 }} />
          <Box flex={1} minWidth={0}>
            <Skeleton variant="text" width="75%" height={24} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="55%" />
          </Box>
          <Skeleton variant="circular" width={28} height={28} sx={{ flexShrink: 0 }} />
        </Box>
        <Box display="flex" gap={1} mt={2}>
          <Skeleton variant="rounded" width={92} height={24} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" width={118} height={24} sx={{ borderRadius: 999 }} />
          <Skeleton variant="rounded" width={140} height={24} sx={{ borderRadius: 999 }} />
        </Box>
        <Skeleton variant="text" width="38%" sx={{ mt: 1 }} />
      </CardContent>
      <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
        <Skeleton variant="rounded" width={96} height={30} sx={{ borderRadius: 1 }} />
      </CardActions>
    </Card>
  );
}

/** Grid of card skeletons matching the results layout (used while a page loads). */
export function RepoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Grid container spacing={2} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={{ xs: 12, md: 6, lg: 4 }}>
          <RepoCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      {message}
    </Alert>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box
      py={6}
      textAlign="center"
      border="1px dashed"
      borderColor="divider"
      borderRadius={2}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {hint ? <Typography variant="body2" color="text.secondary">{hint}</Typography> : null}
    </Box>
  );
}
