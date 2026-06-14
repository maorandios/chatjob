"use client";

import { Avatar } from "@/components/ui/Avatar";
import { getLanguage } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import type { LanguageCode } from "@/types";
import { ChevronRight, CreditCard } from "lucide-react";
import Link from "next/link";

type WorkerSettingsViewProps = {
  token: string;
  workerName: string;
  language: LanguageCode;
  dir?: "ltr" | "rtl";
};

export function WorkerSettingsView({
  token,
  workerName,
  language,
  dir = "ltr",
}: WorkerSettingsViewProps) {
  const ui = getWorkerUi(language);
  const lang = getLanguage(language);

  return (
    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5">
      <div className="space-y-5" dir={dir}>
        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">
            {ui.yourName}
          </p>
          <div className="flex items-center gap-4 rounded-xl bg-[var(--jobchat-surface)] p-4">
            <Avatar name={workerName} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{workerName}</p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="mt-2 w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
          >
            תמונת פרופיל (בקרוב)
          </button>
        </section>

        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">
            {ui.yourLanguage}
          </p>
          <Link
            href={`/invite/${token}?changeLang=1`}
            className="flex w-full items-center justify-between rounded-xl bg-[var(--jobchat-surface)] p-4 hover:bg-gray-100"
          >
            <p className="font-medium text-gray-900">
              {lang.flag} {lang.countryName} · {lang.nativeName}
            </p>
            <ChevronRight
              className={
                dir === "rtl"
                  ? "h-5 w-5 rotate-180 text-gray-400"
                  : "h-5 w-5 text-gray-400"
              }
            />
          </Link>
        </section>

        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">תשלומים</p>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-3 rounded-xl bg-[var(--jobchat-surface)] px-4 py-3 text-start"
          >
            <CreditCard className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">ניהול תשלומים</p>
              <p className="text-xs text-gray-500">בקרוב</p>
            </div>
          </button>
        </section>

        <button
          type="button"
          disabled
          className="w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
        >
          {ui.help} (בקרוב)
        </button>
        <p className="pb-4 text-center text-xs text-gray-400">{ui.prototype}</p>
      </div>
    </div>
  );
}
