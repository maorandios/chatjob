"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type SettingsScreenHeaderProps = {
  title: string;
  backHref: string;
  dir?: "ltr" | "rtl";
};

export function SettingsScreenHeader({
  title,
  backHref,
  dir = "rtl",
}: SettingsScreenHeaderProps) {
  const isRtl = dir === "rtl";

  return (
    <header className="chrome-top shrink-0 border-b border-[var(--jobchat-border)] bg-white">
      <div dir="ltr" className="flex items-center gap-3 px-4 py-3">
        <Link
          href={backHref}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-[var(--jobchat-surface)]"
          aria-label="Back"
        >
          <ArrowLeft className={cn("h-5 w-5", !isRtl && "rotate-180")} />
        </Link>
        <h1
          dir={dir}
          className={cn(
            "min-w-0 flex-1 text-lg font-semibold text-gray-900",
            isRtl ? "text-right" : "text-left"
          )}
        >
          {title}
        </h1>
        <div className="w-10 shrink-0" />
      </div>
    </header>
  );
}
