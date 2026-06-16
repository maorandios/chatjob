"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  labelIcon?: ReactNode;
  error?: string;
  dir?: "ltr" | "rtl";
  inputDir?: "ltr" | "rtl";
};

export function Input({
  className,
  label,
  labelIcon,
  error,
  id,
  dir = "ltr",
  inputDir,
  ...props
}: InputProps) {
  const inputId = id ?? label?.replace(/\s/g, "-").toLowerCase();
  const isRtl = dir === "rtl";
  const fieldDir = inputDir ?? dir;
  const fieldIsRtl = fieldDir === "rtl";

  return (
    <div className="w-full" dir={dir}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "mb-2 flex items-center gap-2 text-sm font-medium text-gray-700",
            isRtl ? "w-full justify-start text-right" : "text-left"
          )}
        >
          <span>{label}</span>
          {labelIcon}
        </label>
      )}
      <input
        id={inputId}
        dir={fieldDir}
        suppressHydrationWarning
        className={cn(
          "min-h-12 w-full rounded-xl border border-[var(--jobchat-border)] bg-white px-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-[var(--jobchat-accent)] focus:ring-2 focus:ring-[var(--jobchat-accent)]/20",
          fieldIsRtl && "text-right placeholder:text-right",
          !fieldIsRtl && "text-left placeholder:text-left",
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
