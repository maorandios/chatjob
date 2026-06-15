"use client";

import { ChevronLeft, CreditCard } from "lucide-react";
import Link from "next/link";

export function PaymentsNavCard() {
  return (
    <section>
      <Link
        href="/manager/settings/payments"
        className="flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-colors active:bg-white/40"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
          <CreditCard className="h-5 w-5 text-[var(--jobchat-accent)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">תשלומים</p>
          <p className="mt-0.5 text-xs leading-snug text-gray-500">
            צפיה וניהול החיוב החודשי
          </p>
        </div>
        <ChevronLeft className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
      </Link>
    </section>
  );
}
