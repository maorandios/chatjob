"use client";

import { AppShell } from "@/components/ui/AppShell";
import Link from "next/link";

export default function DemoPage() {
  return (
    <AppShell dir="rtl">
      <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] px-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--jobchat-accent)] text-2xl font-bold text-white">
          S
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Slang</h1>
        <p className="mt-2 text-sm text-gray-500">
          תקשורת פשוטה בין מנהלים לעובדים — עם תרגום אוטומטי
        </p>
        <Link
          href="/manager"
          className="mt-8 rounded-xl bg-[var(--jobchat-accent)] px-6 py-3 text-sm font-semibold text-white"
        >
          כניסה למנהל
        </Link>
      </div>
    </AppShell>
  );
}
