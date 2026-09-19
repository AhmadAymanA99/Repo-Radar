import { InputAdornment, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export function SearchInput({
  value,
  onChange,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  loading?: boolean;
}) {
  return (
    <TextField
      fullWidth
      label="Search GitHub repositories"
      placeholder="e.g. facebook/react"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        },
      }}
      helperText={loading ? "Searching…" : undefined}
    />
  );
}
