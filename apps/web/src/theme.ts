import { createTheme, type PaletteMode } from "@mui/material";

export function buildTheme(mode: PaletteMode) {
  return createTheme({
    palette: { mode },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            transition: "box-shadow 0.2s ease",
            "&:hover": { boxShadow: theme.shadows[4] },
          }),
        },
      },
    },
  });
}
