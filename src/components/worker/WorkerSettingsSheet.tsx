"use client";

import { Sheet } from "@/components/ui/Sheet";
import { getLanguage } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import type { LanguageCode } from "@/types";
import { ChevronRight } from "lucide-react";

type WorkerSettingsSheetProps = {
  open: boolean;
  onClose: () => void;
  workerName: string;
  language: LanguageCode;
  onChangeLanguage: () => void;
  dir?: "ltr" | "rtl";
};

export function WorkerSettingsSheet({
  open,
  onClose,
  workerName,
  language,
  onChangeLanguage,
  dir = "ltr",
}: WorkerSettingsSheetProps) {
  const ui = getWorkerUi(language);
  const lang = getLanguage(language);

  return (
    <Sheet open={open} onClose={onClose} title={ui.settings}>
      <div className="space-y-3" dir={dir}>
        <div className="rounded-xl bg-[var(--jobchat-surface)] p-4">
          <p className="text-sm text-gray-500">{ui.yourName}</p>
          <p className="mt-1 font-medium text-gray-900">{workerName}</p>
        </div>
        <button
          type="button"
          onClick={onChangeLanguage}
          className="flex w-full items-center justify-between rounded-xl bg-[var(--jobchat-surface)] p-4 text-start hover:bg-gray-100"
        >
          <div>
            <p className="text-sm text-gray-500">{ui.yourLanguage}</p>
            <p className="mt-1 font-medium text-gray-900">
              {lang.flag} {lang.countryName} · {lang.nativeName}
            </p>
          </div>
          <ChevronRight
            className={dir === "rtl" ? "h-5 w-5 rotate-180 text-gray-400" : "h-5 w-5 text-gray-400"}
          />
        </button>
        <button
          type="button"
          disabled
          className="w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
        >
          {ui.help} (בקרוב)
        </button>
        <p className="text-center text-xs text-gray-400">{ui.prototype}</p>
      </div>
    </Sheet>
  );
}
