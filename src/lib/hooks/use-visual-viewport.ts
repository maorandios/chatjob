"use client";

import { useEffect } from "react";

/** Keeps CSS vars in sync with the visual viewport (keyboard, toolbars). */
export function useVisualViewport() {
  useEffect(() => {
    const root = document.documentElement;

    const update = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const keyboardInset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );

      root.style.setProperty("--viewport-height", `${viewport.height}px`);
      root.style.setProperty("--keyboard-inset", `${keyboardInset}px`);
    };

    update();
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);

    return () => {
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
      root.style.removeProperty("--viewport-height");
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);
}
