"use client";

import {
  getLanguagePickerLabel,
  WORKER_LANGUAGES,
} from "@/lib/i18n/languages";
import { LanguageFlag } from "@/components/worker/LanguageFlag";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types";

type LanguagePickerProps = {
  selected?: LanguageCode;
  onSelect: (code: LanguageCode) => void;
};

export function LanguagePicker({ selected, onSelect }: LanguagePickerProps) {
  return (
    <div className="space-y-3">
      {WORKER_LANGUAGES.map((lang) => {
        const isSelected = selected === lang.code;

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onSelect(lang.code)}
            className={cn(
              "flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-start transition-colors active:opacity-90",
              isSelected
                ? "border-[var(--jobchat-accent)] bg-[var(--jobchat-accent-light)] shadow-sm"
                : "border-[var(--jobchat-border)] bg-white/25 hover:border-gray-300 active:bg-white/40"
            )}
          >
            <LanguageFlag
              countryCode={lang.countryCode}
              title={lang.countryName}
              className="h-11 w-11"
            />
            <p className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
              {getLanguagePickerLabel(lang)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
