"use client";

import { TelegramShell } from "@/components/telegram/TelegramShell";
import type { ReactNode } from "react";

export function TelegramLoading({ label = "טוען..." }: { label?: string }) {
  return (
    <TelegramShell>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm opacity-60">{label}</p>
      </div>
    </TelegramShell>
  );
}

export function TelegramMessageScreen({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <TelegramShell>
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="mt-2 text-sm opacity-70">{children}</div>
      </div>
    </TelegramShell>
  );
}
