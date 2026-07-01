"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { isMobileBrowserWithoutInstall } from "@/lib/pwa/display-mode";
import { cn } from "@/lib/utils";
import { Bell, BellOff, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

type PushNotificationSettingsLabels = {
  title: string;
  subtitleOn: string;
  subtitleOff: string;
  installRequiredSubtitle: string;
  installRequiredBody: string;
  activateSubtitle: string;
  activateButton: string;
  sheetTitle: string;
  sheetBody: string;
  toggleOn: string;
  toggleOff: string;
  unsupportedTitle: string;
  unsupportedBody: string;
  deniedBody: string;
  close: string;
};

type PushNotificationSettingsCardProps = {
  userRole: "manager" | "worker";
  userId: string;
  dir?: "ltr" | "rtl";
  labels?: Partial<PushNotificationSettingsLabels>;
};

const DEFAULT_LABELS: PushNotificationSettingsLabels = {
  title: "התראות",
  subtitleOn: "התראות הודעות פעילות",
  subtitleOff: "התראות הודעות כבויות",
  installRequiredSubtitle: "התראות זמינות רק כשהאפליקציה מותקנת בטלפון",
  installRequiredBody:
    "כדי לקבל התראות פוש, הוסיפו את האפליקציה למסך הבית ב-iPhone או ב-Android, ואז הפעילו התראות מההגדרות.",
  activateSubtitle: "הפעילו התראות הודעות",
  activateButton: "הפעל התראות",
  sheetTitle: "התראות הודעות",
  sheetBody: "קבלו התראה כשנשלחת אליכם הודעה חדשה.",
  toggleOn: "פעיל",
  toggleOff: "כבוי",
  unsupportedTitle: "התראות לא נתמכות",
  unsupportedBody:
    "גרסת המכשיר או הדפדפן הזה לא תומכת בהתראות פוש. עדכנו את מערכת ההפעלה או השתמשו בדפדפן נתמך.",
  deniedBody:
    "ההתראות חסומות בדפדפן. כדי להפעיל אותן מחדש, פתחו את הגדרות האתר בדפדפן ואפשרו התראות.",
  close: "סגור",
};

function Toggle({
  checked,
  disabled,
  dir,
}: {
  checked: boolean;
  disabled?: boolean;
  dir: "ltr" | "rtl";
}) {
  return (
    <span
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-[var(--jobchat-accent)]" : "bg-gray-300",
        disabled && "opacity-50"
      )}
      aria-hidden
    >
      <span
        className={cn(
          "absolute start-1 top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked
            ? dir === "rtl"
              ? "-translate-x-5"
              : "translate-x-5"
            : "translate-x-0"
        )}
      />
    </span>
  );
}

export function PushNotificationSettingsCard({
  userRole,
  userId,
  dir = "rtl",
  labels: providedLabels,
}: PushNotificationSettingsCardProps) {
  const labels = { ...DEFAULT_LABELS, ...providedLabels };
  const [open, setOpen] = useState(false);
  const [mobileBrowserBlocked, setMobileBrowserBlocked] = useState(false);
  const {
    state,
    isSupported,
    isEnabled,
    requestPermissionAndSubscribe,
    unsubscribe,
  } = usePushNotifications({
    enabled: Boolean(userId),
    userRole,
    userId,
  });

  useEffect(() => {
    const update = () => setMobileBrowserBlocked(isMobileBrowserWithoutInstall());
    update();

    const media = window.matchMedia?.("(display-mode: standalone)");
    media?.addEventListener?.("change", update);
    return () => media?.removeEventListener?.("change", update);
  }, []);

  const unavailable =
    !isSupported || state === "unsupported" || state === "missing-key";
  const denied = state === "denied";
  const busy = state === "subscribing";
  const needsActivation =
    !mobileBrowserBlocked && !unavailable && !denied && state === "default";

  const subtitle = mobileBrowserBlocked
    ? labels.installRequiredSubtitle
    : unavailable
      ? labels.unsupportedTitle
      : needsActivation
        ? labels.activateSubtitle
        : isEnabled
          ? labels.subtitleOn
          : labels.subtitleOff;

  const Icon = mobileBrowserBlocked || !isEnabled ? BellOff : Bell;

  const handleOpen = () => {
    if (mobileBrowserBlocked) return;
    setOpen(true);
  };

  const handleToggle = async () => {
    if (busy || unavailable || denied) return;
    if (isEnabled) {
      await unsubscribe();
      return;
    }
    await requestPermissionAndSubscribe();
  };

  const handleActivate = async () => {
    if (busy || unavailable || denied || mobileBrowserBlocked) return;
    await requestPermissionAndSubscribe();
  };

  const cardClassName = cn(
    "flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-colors",
    mobileBrowserBlocked
      ? "cursor-default opacity-60"
      : "active:bg-white/40"
  );

  return (
    <>
      <section>
        {mobileBrowserBlocked ? (
          <div className={cardClassName} dir={dir} aria-disabled>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-500">{labels.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-gray-400">{subtitle}</p>
            </div>
          </div>
        ) : (
          <button type="button" onClick={handleOpen} className={cardClassName} dir={dir}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
              <Icon className="h-5 w-5 text-[var(--jobchat-accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{labels.title}</p>
              <p className="mt-0.5 text-xs leading-snug text-gray-500">{subtitle}</p>
            </div>
            <ChevronRight
              className={cn(
                "h-5 w-5 shrink-0 text-gray-400",
                dir === "rtl" && "rotate-180"
              )}
              aria-hidden
            />
          </button>
        )}
      </section>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        dir={dir}
        showCloseButton={false}
      >
        <div dir={dir} className="space-y-5">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
              <Icon className="h-6 w-6 text-[var(--jobchat-accent)]" />
            </div>
            <p className="text-[17px] font-semibold leading-snug text-gray-900">
              {unavailable ? labels.unsupportedTitle : labels.sheetTitle}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {unavailable
                ? labels.unsupportedBody
                : denied
                  ? labels.deniedBody
                  : labels.sheetBody}
            </p>
          </div>

          {needsActivation ? (
            <Button
              fullWidth
              onClick={() => void handleActivate()}
              disabled={busy}
              className="!rounded-2xl"
            >
              {labels.activateButton}
            </Button>
          ) : null}

          {!needsActivation && !unavailable && !denied ? (
            <button
              type="button"
              onClick={() => void handleToggle()}
              disabled={busy}
              className="flex w-full items-center justify-between rounded-2xl bg-[var(--jobchat-surface)] px-4 py-4 text-start disabled:opacity-60"
            >
              <span className="text-sm font-semibold text-gray-900">
                {isEnabled ? labels.toggleOn : labels.toggleOff}
              </span>
              <Toggle checked={isEnabled} disabled={busy} dir={dir} />
            </button>
          ) : null}

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
