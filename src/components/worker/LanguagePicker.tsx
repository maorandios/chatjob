"use client";

import { LANGUAGES } from "@/lib/i18n/languages";
import { cn } from "@/lib/utils";
import type { LanguageCode } from "@/types";

type LanguagePickerProps = {
  selected?: LanguageCode;
  onSelect: (code: LanguageCode) => void;
};

export function LanguagePicker({ selected, onSelect }: LanguagePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onSelect(lang.code)}
          className={cn(
            "flex min-h-[72px] flex-col items-center justify-center rounded-2xl border-2 px-3 py-4 transition-all",
            selected === lang.code
              ? "border-[#25D366] bg-[#25D366]/10 shadow-sm"
              : "border-gray-200 bg-white hover:border-gray-300 active:bg-gray-50"
          )}
        >
          <span className="text-2xl">{lang.flag}</span>
          <span className="mt-1.5 text-sm font-medium text-gray-900">
            {lang.nativeName}
          </span>
        </button>
      ))}
    </div>
  );
}
