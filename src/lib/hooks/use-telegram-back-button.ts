"use client";

import { useEffect } from "react";

export function useTelegramBackButton(
  onBack: () => void,
  visible = true
): void {
  useEffect(() => {
    if (!visible) return;

    let cleanup: (() => void) | undefined;

    void import("@twa-dev/sdk").then(({ default: WebApp }) => {
      WebApp.BackButton.show();
      const handler = () => onBack();
      WebApp.onEvent("backButtonClicked", handler);
      cleanup = () => {
        WebApp.offEvent("backButtonClicked", handler);
        WebApp.BackButton.hide();
      };
    });

    return () => {
      cleanup?.();
    };
  }, [onBack, visible]);
}
