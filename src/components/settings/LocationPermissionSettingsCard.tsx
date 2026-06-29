"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LocateFixed,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LocationPermissionState =
  | "ready"
  | "prompt"
  | "denied"
  | "unsupported"
  | "insecure"
  | "unavailable"
  | "timeout"
  | "checking";

type DeviceOs = "ios" | "android" | "desktop";

type LocationPermissionLabels = {
  title: string;
  subtitleReady: string;
  subtitleNeedsSetup: string;
  sheetTitle: string;
  sheetBody: string;
  readyTitle: string;
  readyBody: string;
  deniedTitle: string;
  deniedBody: string;
  unsupportedTitle: string;
  unsupportedBody: string;
  insecureTitle: string;
  insecureBody: string;
  unavailableTitle: string;
  unavailableBody: string;
  timeoutTitle: string;
  timeoutBody: string;
  iosTitle: string;
  iosSteps: string[];
  androidTitle: string;
  androidSteps: string[];
  desktopTitle: string;
  desktopSteps: string[];
  testButton: string;
  testingButton: string;
  close: string;
};

type LocationPermissionSettingsCardProps = {
  dir?: "ltr" | "rtl";
  labels?: Partial<LocationPermissionLabels>;
};

const DEFAULT_LABELS: LocationPermissionLabels = {
  title: "שיתוף מיקום",
  subtitleReady: "שיתוף מיקום מוכן לשימוש",
  subtitleNeedsSetup: "בדקו הרשאת מיקום במכשיר",
  sheetTitle: "הרשאת שיתוף מיקום",
  sheetBody:
    "כדי לשלוח מיקום בצ׳אט, צריך לאשר גישה למיקום בדפדפן ובמערכת ההפעלה.",
  readyTitle: "שיתוף מיקום מוכן",
  readyBody: "המכשיר אישר גישה למיקום. אפשר לשלוח מיקום מתוך הצ׳אט.",
  deniedTitle: "גישה למיקום חסומה",
  deniedBody: "פתחו את הגדרות המכשיר ואשרו גישה למיקום עבור הדפדפן.",
  unsupportedTitle: "שיתוף מיקום לא נתמך",
  unsupportedBody: "הדפדפן או המכשיר הזה לא תומך בשיתוף מיקום.",
  insecureTitle: "צריך חיבור מאובטח",
  insecureBody:
    "שיתוף מיקום עובד רק ב-HTTPS או בסביבה מאובטחת. אם אתם בודקים דרך כתובת IP מקומית, פתחו גרסה מאובטחת.",
  unavailableTitle: "לא ניתן למצוא מיקום",
  unavailableBody: "ודאו ששירותי המיקום פעילים במכשיר ונסו שוב.",
  timeoutTitle: "איתור המיקום לקח יותר מדי זמן",
  timeoutBody: "עברו למקום עם קליטה טובה יותר ונסו שוב.",
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
  testButton: "בדיקת מיקום",
  testingButton: "בודק מיקום...",
  close: "סגור",
};

function detectDeviceOs(): DeviceOs {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const isIpadOs =
    platform === "MacIntel" && "maxTouchPoints" in navigator && navigator.maxTouchPoints > 1;
  if (/iPad|iPhone|iPod/i.test(ua) || isIpadOs) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 15_000,
    });
  });
}

function getStateCopy(
  state: LocationPermissionState,
  labels: LocationPermissionLabels
): { title: string; body: string } {
  switch (state) {
    case "ready":
      return { title: labels.readyTitle, body: labels.readyBody };
    case "denied":
      return { title: labels.deniedTitle, body: labels.deniedBody };
    case "unsupported":
      return { title: labels.unsupportedTitle, body: labels.unsupportedBody };
    case "insecure":
      return { title: labels.insecureTitle, body: labels.insecureBody };
    case "unavailable":
      return { title: labels.unavailableTitle, body: labels.unavailableBody };
    case "timeout":
      return { title: labels.timeoutTitle, body: labels.timeoutBody };
    default:
      return { title: labels.sheetTitle, body: labels.sheetBody };
  }
}

export function LocationPermissionSettingsCard({
  dir = "rtl",
  labels: providedLabels,
}: LocationPermissionSettingsCardProps) {
  const labels = useMemo(
    () => ({ ...DEFAULT_LABELS, ...providedLabels }),
    [providedLabels]
  );
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LocationPermissionState>("prompt");
  const os = useMemo(() => detectDeviceOs(), []);
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;
  const isReady = state === "ready";
  const isChecking = state === "checking";
  const Icon = isReady ? CheckCircle2 : state === "denied" ? ShieldAlert : MapPin;
  const stateCopy = getStateCopy(state, labels);
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (!window.isSecureContext) {
      timeoutId = setTimeout(() => setState("insecure"), 0);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }
    if (!("geolocation" in navigator)) {
      timeoutId = setTimeout(() => setState("unsupported"), 0);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    }

    let cancelled = false;
    const permissions = navigator.permissions;
    if (!permissions?.query) return;

    permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setState(status.state === "granted" ? "ready" : status.state);
        status.onchange = () => {
          setState(status.state === "granted" ? "ready" : status.state);
        };
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleTestLocation = async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setState("insecure");
      return;
    }
    if (!("geolocation" in navigator)) {
      setState("unsupported");
      return;
    }

    setState("checking");
    try {
      await getCurrentPosition();
      setState("ready");
    } catch (error) {
      const geoError =
        typeof error === "object" && error !== null && "code" in error
          ? (error as GeolocationPositionError)
          : null;
      if (geoError?.code === 1) {
        setState("denied");
      } else if (geoError?.code === 2) {
        setState("unavailable");
      } else if (geoError?.code === 3) {
        setState("timeout");
      } else {
        setState("prompt");
      }
    }
  };

  return (
    <>
      <section>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-colors active:bg-white/40"
          dir={dir}
        >
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              isReady ? "bg-green-100" : "bg-[var(--jobchat-accent-light)]"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isReady ? "text-green-600" : "text-[var(--jobchat-accent)]"
              )}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">{labels.title}</p>
            <p className="mt-0.5 text-xs leading-snug text-gray-500">
              {isReady ? labels.subtitleReady : labels.subtitleNeedsSetup}
            </p>
          </div>
          <Chevron className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
        </button>
      </section>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        dir={dir}
        showCloseButton={false}
      >
        <div dir={dir} className="space-y-5">
          <div className="text-center">
            <div
              className={cn(
                "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                isReady ? "bg-green-100" : "bg-[var(--jobchat-accent-light)]"
              )}
            >
              {isChecking ? (
                <Loader2 className="h-6 w-6 animate-spin text-[var(--jobchat-accent)]" />
              ) : (
                <Icon
                  className={cn(
                    "h-6 w-6",
                    isReady ? "text-green-600" : "text-[var(--jobchat-accent)]"
                  )}
                />
              )}
            </div>
            <p className="text-[17px] font-semibold leading-snug text-gray-900">
              {stateCopy.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {stateCopy.body}
            </p>
          </div>

          {!isReady && (
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
          )}

          <button
            type="button"
            onClick={() => void handleTestLocation()}
            disabled={isChecking}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--jobchat-accent)] px-4 py-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
            {isChecking ? labels.testingButton : labels.testButton}
          </button>

          <Button
            fullWidth
            variant="secondary"
            onClick={() => setOpen(false)}
            className="!rounded-2xl text-gray-600"
          >
            {labels.close}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

