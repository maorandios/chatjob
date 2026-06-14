"use client";

import { TeamListSection } from "@/components/settings/TeamListSection";
import { Avatar } from "@/components/ui/Avatar";
import { useSlangStore } from "@/lib/store";
import { CreditCard, Shield } from "lucide-react";

export function ManagerSettingsView() {
  const companyName = useSlangStore((s) => s.companyName);
  const managerName = useSlangStore((s) => s.managerName);
  const managerPhone = useSlangStore((s) => s.managerPhone);
  const isAdmin = useSlangStore((s) => s.isAdmin);

  return (
    <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto bg-white px-4 py-5">
      <div className="space-y-5">
        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">פרופיל</p>
          <div className="flex items-center gap-4 rounded-xl bg-[var(--jobchat-surface)] p-4">
            <Avatar name={managerName} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900">{managerName}</p>
              <p className="text-sm text-gray-500" dir="ltr">
                {managerPhone}
              </p>
              <p className="mt-1 text-xs text-gray-400">{companyName}</p>
            </div>
          </div>
          <button
            type="button"
            disabled
            className="mt-2 w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
          >
            תמונת פרופיל (בקרוב)
          </button>
          <button
            type="button"
            disabled
            className="mt-2 w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
          >
            עריכת שם (בקרוב)
          </button>
        </section>

        <section>
          <p className="mb-3 text-sm font-semibold text-gray-700">תשלומים</p>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-3 rounded-xl bg-[var(--jobchat-surface)] px-4 py-3 text-start"
          >
            <CreditCard className="h-5 w-5 shrink-0 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">ניהול תשלומים</p>
              <p className="text-xs text-gray-500">בקרוב</p>
            </div>
          </button>
        </section>

        {isAdmin && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[var(--jobchat-accent)]" />
              <p className="text-sm font-semibold text-gray-700">ניהול צוות</p>
            </div>
            <TeamListSection />
          </section>
        )}

        <button
          type="button"
          disabled
          className="w-full rounded-xl border border-[var(--jobchat-border)] px-4 py-3 text-sm text-gray-400"
        >
          התנתקות (בקרוב)
        </button>
        <p className="pb-4 text-center text-xs text-gray-400">Slang</p>
      </div>
    </div>
  );
}
