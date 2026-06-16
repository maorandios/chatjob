"use client";

import * as Flags from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

type LanguageFlagProps = {
  countryCode: string;
  className?: string;
  title?: string;
};

export function LanguageFlag({
  countryCode,
  className,
  title,
}: LanguageFlagProps) {
  const code = countryCode.toUpperCase();
  const Flag = Flags[code as keyof typeof Flags];

  if (!Flag) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-gray-200 ring-2 ring-gray-200 text-[10px] font-semibold text-gray-500",
          className
        )}
        title={title}
      >
        {code}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200",
        className
      )}
      title={title}
    >
      <Flag className="h-full w-full object-cover" aria-hidden />
    </span>
  );
}
