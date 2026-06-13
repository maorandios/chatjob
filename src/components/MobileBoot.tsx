"use client";

import { useEffect } from "react";

/** Fixes iOS Safari/PWA touch and clears stale cached overlay shells. */
export function MobileBoot() {
  useEffect(() => {
    document.getElementById("jobchat-overlays")?.remove();

    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
    }

    // Enables reliable :active/click handling on older iOS WebKit.
    const noop = () => undefined;
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);

  return null;
}
