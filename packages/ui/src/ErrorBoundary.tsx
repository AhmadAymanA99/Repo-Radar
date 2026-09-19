import { Component, type ReactNode } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Catches render crashes below it and shows a recovery UI instead of a blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Box display="flex" flexDirection="column" gap={2} alignItems="flex-start">
          <Alert severity="error">Something went wrong while rendering this view.</Alert>
          <Typography variant="body2" color="text.secondary">
            {this.state.error.message}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              this.setState({ error: null });
              window.location.reload();
            }}
          >
            Reload
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
