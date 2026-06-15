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
      <div
        dir={dir}
        className="flex items-center justify-between gap-3 px-4 py-3"
      >
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <Link
          href={backHref}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-[var(--jobchat-surface)]"
          aria-label="Back"
        >
          <ArrowLeft className={cn("h-5 w-5", !isRtl && "rotate-180")} />
        </Link>
      </div>
    </header>
  );
}
