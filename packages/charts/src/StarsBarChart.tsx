import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { formatStars, type TrackedRepo } from "@repo/github-api";

export interface StarsBarChartProps {
  repos: TrackedRepo[];
}

const compact = (v: number | null) => (v == null ? "" : formatStars(v));
const exact = (v: number | null) => (v == null ? "" : `${v.toLocaleString()} stars`);

/** Stars-per-repository bar chart (MUI X Charts, wrapped as a shared package). */
export function StarsBarChart({ repos }: StarsBarChartProps) {
  const theme = useTheme();
  // Hooks must run before the early return below.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (repos.length === 0) return null;

  const sorted = [...repos].sort((a, b) => b.repo.stargazers_count - a.repo.stargazers_count);
  const fullLabels = sorted.map((r) => r.repo.name);
  const values = sorted.map((r) => r.repo.stargazers_count);

  // Horizontal bars on mobile: repo names get the full y-axis width instead of
  // squeezing into angled x-axis ticks. Names are shortened; exact counts stay
  // in the tooltip and on the cards below.
  if (isMobile) {
    const labels = fullLabels.map((n) => (n.length > 12 ? `${n.slice(0, 11)}…` : n));
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Stars per tracked repository
        </Typography>
        <BarChart
          layout="horizontal"
          yAxis={[{ data: labels, scaleType: "band", tickLabelStyle: { fontSize: 11 } }]}
          xAxis={[{ tickNumber: 4, valueFormatter: compact, tickLabelStyle: { fontSize: 11 } }]}
          series={[
            {
              data: values,
              color: theme.palette.primary.main,
              label: "Stars",
              valueFormatter: exact,
            },
          ]}
          height={Math.max(220, 52 * sorted.length)}
          margin={{ left: 100, right: 16, top: 16, bottom: 40 }}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Stars per tracked repository
      </Typography>
      <BarChart
        xAxis={[
          {
            data: fullLabels,
            scaleType: "band",
            // Angled labels stay readable on narrow screens instead of overlapping.
            tickLabelStyle: { angle: -35, textAnchor: "end", fontSize: 11 },
          },
        ]}
        // Compact ticks (120k instead of 120000) with a capped tick count so
        // large star counts stay clean and never overlap.
        yAxis={[
          {
            tickNumber: 5,
            valueFormatter: compact,
          },
        ]}
        series={[
          {
            data: values,
            color: theme.palette.primary.main,
            label: "Stars",
            valueFormatter: exact,
          },
        ]}
        height={Math.max(280, 60 * sorted.length)}
        margin={{ left: 56, right: 16, top: 32, bottom: 110 }}
      />
    </Box>
  );
}
