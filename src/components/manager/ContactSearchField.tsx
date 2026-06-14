"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

type ContactSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function ContactSearchField({
  value,
  onChange,
  placeholder = "חיפוש",
  className,
}: ContactSearchFieldProps) {
  return (
    <div className={cn("relative w-full", className)} dir="rtl">
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        dir="rtl"
        enterKeyHint="search"
        className="min-h-11 w-full rounded-xl border border-[var(--jobchat-border)] bg-white/15 py-2.5 pr-11 pl-4 text-right text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-[var(--jobchat-accent)] focus:ring-2 focus:ring-[var(--jobchat-accent)]/20"
      />
      <Search
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
    </div>
  );
}
