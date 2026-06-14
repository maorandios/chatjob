"use client";

import { cn } from "@/lib/utils";
import { UserRound } from "lucide-react";
import Link from "next/link";

type UserSettingsButtonProps = {
  href?: string;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

export function UserSettingsButton({
  href,
  onClick,
  className,
  ariaLabel = "Settings",
}: UserSettingsButtonProps) {
  const classes = cn(
    "flex h-11 w-11 touch-manipulation items-center justify-center rounded-full text-gray-700 active:bg-[var(--jobchat-surface)]",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        <UserRound className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      <UserRound className="h-5 w-5" />
    </button>
  );
}
