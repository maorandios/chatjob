"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { MapPinOff } from "lucide-react";
import { useMemo } from "react";

type DeviceOs = "ios" | "android" | "desktop";

export type LocationInstructionsLabels = {
  title: string;
  body: string;
  iosTitle: string;
  iosSteps: string[];
  androidTitle: string;
  androidSteps: string[];
  desktopTitle: string;
  desktopSteps: string[];
  close: string;
};

type LocationInstructionsSheetProps = {
  open: boolean;
  onClose: () => void;
  dir?: "ltr" | "rtl";
  labels?: Partial<LocationInstructionsLabels>;
};

const DEFAULT_LABELS: LocationInstructionsLabels = {
  title: "צריך לאפשר שיתוף מיקום",
  body: "כדי לשלוח מיקום בצ׳אט, צריך לאשר גישה למיקום בדפדפן ובמערכת ההפעלה.",
  iosTitle: "איך לאפשר מיקום באייפון",
  iosSteps: [
    "פתחו Settings באייפון",
    "עברו אל Privacy & Security",
    "פתחו Location Services",
    "ודאו ש-Location Services פעיל",
    "פתחו Safari Websites",
    "בחרו While Using the App",
    "חזרו לקלינג ונסו לשלוח מיקום שוב",
  ],
  androidTitle: "איך לאפשר מיקום באנדרואיד",
  androidSteps: [
    "פתחו את Chrome",
    "פתחו Site settings עבור האתר",
    "פתחו Location",
    "בחרו Allow",
    "ודאו שמיקום המכשיר פעיל",
    "חזרו לקלינג ונסו לשלוח מיקום שוב",
  ],
  desktopTitle: "איך לאפשר מיקום בדפדפן",
  desktopSteps: [
    "פתחו את הגדרות האתר בדפדפן",
    "פתחו Location",
    "בחרו Allow",
    "רעננו את קלינג ונסו שוב",
  ],
  close: "סגור",
};

function detectDeviceOs(): DeviceOs {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const isIpadOs =
    platform === "MacIntel" &&
    "maxTouchPoints" in navigator &&
    navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/i.test(ua) || isIpadOs) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function LocationInstructionsSheet({
  open,
  onClose,
  dir = "rtl",
  labels: providedLabels,
}: LocationInstructionsSheetProps) {
  const labels = { ...DEFAULT_LABELS, ...providedLabels };
  const os = useMemo(() => detectDeviceOs(), []);
  const guideTitle =
    os === "ios"
      ? labels.iosTitle
      : os === "android"
        ? labels.androidTitle
        : labels.desktopTitle;
  const guideSteps =
    os === "ios"
      ? labels.iosSteps
      : os === "android"
        ? labels.androidSteps
        : labels.desktopSteps;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      dir={dir}
      showCloseButton={false}
    >
      <div dir={dir} className="space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
            <MapPinOff className="h-6 w-6 text-[var(--jobchat-accent)]" />
          </div>
          <p className="text-[17px] font-semibold leading-snug text-gray-900">
            {labels.title}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {labels.body}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--jobchat-surface)] px-4 py-4">
          <p className="text-sm font-semibold text-gray-900">{guideTitle}</p>
          <ol className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
            {guideSteps.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="shrink-0 font-semibold text-[var(--jobchat-accent)]">
                  {index + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <Button
          fullWidth
          variant="secondary"
          onClick={onClose}
          className="!rounded-2xl text-gray-600"
        >
          {labels.close}
        </Button>
      </div>
    </Sheet>
  );
}

