"use client";

import { useEffect, useRef } from "react";

const DEFAULT_INTERVAL_MS = 8_000;

/**
 * Runs `callback` when the tab becomes visible and on a fixed interval while visible.
 * Fallback when Supabase Realtime is unavailable or delayed.
 */
export function useVisibilityPoll(
  callback: () => void,
  enabled = true,
  intervalMs = DEFAULT_INTERVAL_MS
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const run = () => {
      callbackRef.current();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        run();
      }
    };

    const onFocus = () => {
      run();
    };

    run();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        run();
      }
    }, intervalMs);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs]);
}
