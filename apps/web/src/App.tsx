import { useMemo, useState } from "react";import {
  AppBar,
  Badge,
  Container,
  CssBaseline,
  Divider,
  IconButton,
  Paper,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  type PaletteMode,
} from "@mui/material";
import RadarIcon from "@mui/icons-material/Radar";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useRepoStore } from "@repo/store";
import { ErrorBoundary, TypewriterText } from "@repo/ui";
import { buildTheme } from "./theme";
import { SearchView, TrackedView } from "./views";

function useColorMode(): [PaletteMode, () => void] {
  const [mode, setMode] = useState<PaletteMode>(() => {
    try {
      return (localStorage.getItem("repo-radar:theme") as PaletteMode) || "light";
    } catch {
      return "light";
    }
  });
  const toggle = () => {
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      try {
        localStorage.setItem("repo-radar:theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return [mode, toggle];
}

export default function App() {
  const [mode, toggleMode] = useColorMode();
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const [tab, setTab] = useState(0);
  const trackedMap = useRepoStore((s) => s.tracked);
  const trackedCount = Object.keys(trackedMap).length;
  // Derived via useMemo on the stable map reference: passing a selector that
  // builds a new array (selectTrackedList) directly to the store would return
  // a fresh reference on every snapshot check and send React into an infinite
  // re-render loop (blank page).
  const trackedList = useMemo(
    () =>
      Object.values(trackedMap).sort(
        (a, b) => b.repo.stargazers_count - a.repo.stargazers_count,
      ),
    [trackedMap],
  );
  const totalStars = trackedList.reduce((a, t) => a + t.repo.stargazers_count, 0);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ gap: 1 }}>
          <RadarIcon color="primary" sx={{ flexShrink: 0 }} />
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              flexGrow: 1,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: { xs: "1.05rem", sm: "1.25rem" },
            }}
          >
            Repo Radar
          </Typography>
          <Tooltip title="Open GitHub API docs">
            <IconButton
              component="a"
              href="https://docs.github.com/en/rest"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub API docs"
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
            <IconButton onClick={toggleMode} aria-label="Toggle theme">
              {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 3 }}
      >
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h5" gutterBottom>
            <TypewriterText text="Search, track, and monitor GitHub repositories" />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {trackedCount === 0
              ? "Track repos to see live stars, open issues, last commit, and a stars chart."
              : `Tracking ${trackedCount} ${trackedCount === 1 ? "repo" : "repos"} · ${totalStars.toLocaleString()} total stars.`}
          </Typography>
        </Paper>

        <Tabs
          value={tab}
          onChange={(_, v: number) => setTab(v)}
          aria-label="Views"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab label="Search" />
          <Tab
            label={
              <Badge badgeContent={trackedCount} color="primary" sx={{ pr: 1 }}>
                Tracked
              </Badge>
            }
          />
        </Tabs>
        <Divider />

        {tab === 0 ? (
          <ErrorBoundary>
            <SearchView />
          </ErrorBoundary>
        ) : null}
        {tab === 1 ? (
          <ErrorBoundary>
            <TrackedView />
          </ErrorBoundary>
        ) : null}
      </Container>
    </ThemeProvider>
  );
}
