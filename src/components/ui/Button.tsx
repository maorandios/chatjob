"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--jobchat-accent)] text-white hover:opacity-90 active:opacity-80 disabled:bg-gray-300 disabled:text-gray-500",
  secondary:
    "bg-[var(--jobchat-surface)] text-gray-900 hover:bg-gray-200 active:bg-gray-300",
  ghost: "bg-transparent text-gray-700 hover:bg-[var(--jobchat-surface)]",
  outline:
    "border border-[var(--jobchat-border)] bg-white text-gray-900 hover:bg-[var(--jobchat-surface)] active:bg-gray-100",
};

export function Button({
  className,
  variant = "primary",
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-base font-medium transition-colors",
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
