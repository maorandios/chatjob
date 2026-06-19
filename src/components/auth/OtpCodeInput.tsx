"use client";

import { EMAIL_OTP_LENGTH } from "@/lib/auth/otp";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

function otpGridClassName(length: number): string {
  if (length <= 6) return "grid-cols-6 gap-2";
  if (length === 8) return "grid-cols-4 gap-2";
  return "grid-cols-5 gap-1.5";
}

export function OtpCodeInput({
  value,
  onChange,
  disabled,
  error,
}: OtpCodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const digits = value
    .padEnd(EMAIL_OTP_LENGTH, " ")
    .split("")
    .slice(0, EMAIL_OTP_LENGTH);

  const scrollIntoView = () => {
    window.setTimeout(() => {
      containerRef.current?.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    }, 120);
  };

  return (
    <div ref={containerRef} className="w-full scroll-my-24">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={EMAIL_OTP_LENGTH}
          value={value}
          disabled={disabled}
          suppressHydrationWarning
          onFocus={scrollIntoView}
          onClick={scrollIntoView}
          onChange={(e) => {
            const next = e.target.value
              .replace(/\D/g, "")
              .slice(0, EMAIL_OTP_LENGTH);
            onChange(next);
          }}
          className="absolute inset-0 h-full w-full cursor-text opacity-0"
          aria-label="קוד אימות"
        />
        <div
          className={cn(
            "grid",
            otpGridClassName(EMAIL_OTP_LENGTH),
            disabled && "opacity-60"
          )}
          dir="ltr"
        >
          {digits.map((digit, index) => (
            <div
              key={index}
              className={cn(
                "flex h-12 items-center justify-center rounded-xl border bg-white text-lg font-semibold tabular-nums text-gray-900",
                error
                  ? "border-red-400"
                  : value.length === index
                    ? "border-[var(--jobchat-accent)] ring-2 ring-[var(--jobchat-accent)]/20"
                    : "border-[var(--jobchat-border)]"
              )}
            >
              {digit.trim() || ""}
            </div>
          ))}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
