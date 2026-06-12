"use client";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

type ChatHeaderProps = {
  name: string;
  subtitle?: string;
  backHref?: string;
  onAvatarClick?: () => void;
  dir?: "ltr" | "rtl";
  showOnline?: boolean;
  hideBack?: boolean;
};

export function ChatHeader({
  name,
  subtitle = "פעיל",
  backHref,
  onAvatarClick,
  dir = "rtl",
  showOnline = true,
  hideBack = false,
}: ChatHeaderProps) {
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <header className="flex items-center gap-3 bg-[#075E54] px-3 py-3 text-white safe-top">
      {!hideBack && backHref ? (
        <Link
          href={backHref}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Back"
        >
          <BackIcon className="h-5 w-5" />
        </Link>
      ) : (
        <div className="w-10" />
      )}
      <button
        type="button"
        onClick={onAvatarClick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 text-start",
          onAvatarClick && "cursor-pointer"
        )}
      >
        <Avatar name={name} size="sm" className="bg-white/20 text-white" />
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          {subtitle && (
            <p className="flex items-center gap-1.5 text-xs text-white/80">
              {showOnline && (
                <span className="h-2 w-2 rounded-full bg-[#25D366]" />
              )}
              {subtitle}
            </p>
          )}
        </div>
      </button>
    </header>
  );
}
