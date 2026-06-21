"use client";

import {
  InstallAppSheet,
  type InstallAppSheetLabels,
} from "@/components/ui/InstallAppSheet";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

type InstallAppBannerProps = {
  text: string;
  actionLabel: string;
  installLabels: InstallAppSheetLabels;
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
  installLabels,
  dir = "rtl",
  onInstallClick,
}: InstallAppBannerProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [showInstallSheet, setShowInstallSheet] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setShouldShow(!isStandaloneDisplay());
    updateVisibility();

    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", updateVisibility);
    return () => media?.removeEventListener?.("change", updateVisibility);
  }, []);

  const handleInstallClick = () => {
    onInstallClick?.();
    setShowInstallSheet(true);
  };

  return (
    <>
      {shouldShow && (
        <div
          dir={dir}
          className="install-banner chrome-top shrink-0 bg-white px-4 py-4"
        >
          <div className="flex min-h-12 items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-start text-[13px] font-medium leading-5 text-[#FF4400]">
              {text}
            </p>
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex h-10 shrink-0 touch-manipulation items-center gap-1.5 rounded-full border border-[#FF4400] bg-[#FFE0D5] px-4 text-[13px] font-semibold text-[#FF4400] active:scale-[0.98]"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.1} />
              {actionLabel}
            </button>
          </div>
        </div>
      )}

      <InstallAppSheet
        open={showInstallSheet}
        onClose={() => setShowInstallSheet(false)}
        labels={installLabels}
        dir={dir}
      />
    </>
  );
}
