"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallAppBannerProps = {
  text: string;
  actionLabel: string;
  dir?: "ltr" | "rtl";
  onInstallClick?: () => void;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return true;
  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(standaloneMedia || iosStandalone);
}

export function InstallAppBanner({
  text,
  actionLabel,
  dir = "rtl",
  onInstallClick,
}: InstallAppBannerProps) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setShouldShow(!isStandaloneDisplay());
    updateVisibility();

    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", updateVisibility);
    return () => media?.removeEventListener?.("change", updateVisibility);
  }, []);

  if (!shouldShow) return null;

  return (
    <div
      dir={dir}
      className="install-banner chrome-top shrink-0 bg-white px-4 py-4"
    >
      <div className="flex min-h-12 items-center gap-3">
        <p className="min-w-0 flex-1 truncate text-start text-[13px] font-medium leading-5 text-gray-600">
          {text}
        </p>
        <button
          type="button"
          onClick={onInstallClick}
          className="flex h-10 shrink-0 touch-manipulation items-center gap-1.5 rounded-full bg-[var(--jobchat-accent-light)] px-4 text-[13px] font-semibold text-[var(--jobchat-accent)] active:scale-[0.98]"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2.1} />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
