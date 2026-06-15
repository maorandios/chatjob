"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  dir?: "ltr" | "rtl";
};

export function Input({
  className,
  label,
  error,
  id,
  dir = "ltr",
  ...props
}: InputProps) {
  const inputId = id ?? label?.replace(/\s/g, "-").toLowerCase();
  const isRtl = dir === "rtl";

  return (
    <div className="w-full" dir={dir}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "mb-2 block text-sm font-medium text-gray-700",
            isRtl && "text-right"
          )}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        dir={dir}
        suppressHydrationWarning
        className={cn(
          "min-h-12 w-full rounded-xl border border-[var(--jobchat-border)] bg-white px-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--jobchat-accent)] focus:ring-2 focus:ring-[var(--jobchat-accent)]/20",
          isRtl && "text-right",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
      {error && (
        <p className={cn("mt-1.5 text-sm text-red-600", isRtl && "text-right")}>
          {error}
        </p>
      )}
    </div>
  );
}
