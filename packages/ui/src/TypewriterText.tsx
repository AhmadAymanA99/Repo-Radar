import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

export interface TypewriterTextProps {
  text: string;
  /** Per-character delay in ms. */
  speedMs?: number;
  /** Delay before typing starts in ms. */
  startDelayMs?: number;
  showCaret?: boolean;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Types out `text` character-by-character on mount (instant when reduced motion is preferred). */
export function TypewriterText({
  text,
  speedMs = 36,
  startDelayMs = 350,
  showCaret = true,
}: TypewriterTextProps) {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));
  const done = count >= text.length;

  // Restart if the text changes.
  useEffect(() => {
    setCount(prefersReducedMotion() ? text.length : 0);
  }, [text]);

  useEffect(() => {
    if (done) return;
    const delay = count === 0 ? startDelayMs : speedMs;
    const t = setTimeout(() => setCount((c) => Math.min(text.length, c + 1)), delay);
    return () => clearTimeout(t);
  }, [count, done, text.length, speedMs, startDelayMs]);

  return (
    <span aria-label={text}>
      <span aria-hidden="true">{text.slice(0, count)}</span>
      {showCaret && !done ? (
        <Box
          component="span"
          aria-hidden="true"
          sx={{ animation: `${blink} 1s step-end infinite`, fontWeight: 300 }}
        >
          |
        </Box>
      ) : null}
    </span>
  );
}
