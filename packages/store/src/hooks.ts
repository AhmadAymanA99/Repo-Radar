import { useEffect, useRef, useState } from "react";

/** Debounce any fast-changing value (used for the GitHub search input). */
export function useDebouncedValue<T>(value: T, delayMs = 500): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/** Async hook with explicit idle/loading/success/error states + cancellation. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const id = ++runId.current;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (!cancelled && runId.current === id) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled && runId.current === id) {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      })
      .finally(() => {
        if (!cancelled && runId.current === id) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
