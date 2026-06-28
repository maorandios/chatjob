"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import { CheckCircle2, Download, ExternalLink, Share, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallPlatform = "ios" | "android" | "other";

export type InstallAppSheetLabels = {
  title: string;
  iosTitle: string;
  iosSubtitle: string;
  iosStepShare: string;
  iosStepHome: string;
  iosStepDone: string;
  androidTitle: string;
  androidReady: string;
  androidUnavailable: string;
  androidButton: string;
  laterButton: string;
};

type InstallAppSheetProps = {
  open: boolean;
  onClose: () => void;
  labels: InstallAppSheetLabels;
  dir?: "ltr" | "rtl";
};

const DEFAULT_IOS_GIF_SRC = "/install-ios.gif";

function detectInstallPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "other";
  const userAgent = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "other";
}

export function InstallAppSheet({
  open,
  onClose,
  labels,
  dir = "rtl",
}: InstallAppSheetProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);
  const [showGifFallback, setShowGifFallback] = useState(false);

  const platform = useMemo(detectInstallPlatform, []);
  const isIos = platform === "ios";
  const isAndroid = platform === "android";

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt || installing) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      onClose();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      dir={dir}
      className="px-5 pb-4 pt-3"
      showCloseButton={false}
    >
      <div className="space-y-4" dir={dir}>
        {isIos ? (
          <>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-900">
                {labels.iosTitle}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {labels.iosSubtitle}
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-[var(--jobchat-border)] bg-[var(--jobchat-surface)]">
              {!showGifFallback ? (
                <img
                  src={DEFAULT_IOS_GIF_SRC}
                  alt=""
                  className="h-44 w-full object-cover"
                  onError={() => setShowGifFallback(true)}
                />
              ) : (
                <div className="flex h-44 flex-col items-center justify-center gap-2 px-6 text-center">
                  <Smartphone className="h-9 w-9 text-[var(--jobchat-accent)]" />
                  <p className="text-sm font-medium text-gray-700">
                    iPhone install guide
                  </p>
                  <p className="text-xs leading-relaxed text-gray-500">
                    Add `/public/install-ios.gif` later and it will appear here.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <InstallStep icon={<Share />} text={labels.iosStepShare} />
              <InstallStep icon={<ExternalLink />} text={labels.iosStepHome} />
              <InstallStep icon={<CheckCircle2 />} text={labels.iosStepDone} />
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)]">
                <Download className="h-6 w-6" />
              </div>
              <p className="text-base font-semibold text-gray-900">
                {labels.androidTitle}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {isAndroid && deferredPrompt
                  ? labels.androidReady
                  : labels.androidUnavailable}
              </p>
            </div>

            {isAndroid && deferredPrompt ? (
              <Button
                fullWidth
                onClick={() => void handleAndroidInstall()}
                disabled={installing}
                className="!rounded-2xl"
              >
                {labels.androidButton}
              </Button>
            ) : null}
          </>
        )}

        <Button
          fullWidth
          variant="secondary"
          onClick={onClose}
          className="!rounded-2xl text-gray-600"
        >
          {labels.laterButton}
        </Button>
      </div>
    </Sheet>
  );
}

function InstallStep({ icon, text }: { icon: ReactElement; text: string }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--jobchat-surface)] px-2 py-3 text-center">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[var(--jobchat-accent)] shadow-sm">
        {icon}
      </span>
      <p className="text-xs font-medium leading-snug text-gray-700">
        {text}
      </p>
    </div>
  );
}
