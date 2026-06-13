"use client";

import { WORKER_LANGUAGES } from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types";

type LanguagePickerProps = {
  selected?: LanguageCode;
  onSelect: (code: LanguageCode) => void;
};

export function LanguagePicker({ selected, onSelect }: LanguagePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {WORKER_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onSelect(lang.code)}
          className={cn(
            "flex min-h-[80px] flex-col items-center justify-center rounded-2xl border-2 px-3 py-4 transition-all",
            selected === lang.code
              ? "border-[var(--jobchat-accent)] bg-[var(--jobchat-accent-light)] shadow-sm"
              : "border-[var(--jobchat-border)] bg-white hover:border-gray-300 active:bg-[var(--jobchat-surface)]"
          )}
        >
          <span className="text-2xl">{lang.flag}</span>
          <span className="mt-1.5 text-sm font-semibold text-gray-900">
            {lang.countryName}
          </span>
          <span className="mt-0.5 text-xs text-gray-500">{lang.nativeName}</span>
        </button>
      ))}
    </div>
  );
}
