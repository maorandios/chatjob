"use client";

import { Button } from "@/components/ui/Button";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { DEMO_INVITE_TOKEN } from "@/lib/mock/seed";
import { useJobChatStore } from "@/lib/mock/store";
import { MessageCircle, RotateCcw, UserPlus } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  const reset = useJobChatStore((s) => s.reset);
  const workers = useJobChatStore((s) => s.workers);

  const handleReset = () => {
    reset();
    window.location.reload();
  };

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col px-6 py-10">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--jobchat-accent)] text-2xl font-bold text-white">
            JC
          </div>
          <h1 className="text-2xl font-bold text-gray-900">JobChat</h1>
          <p className="mt-2 text-sm text-gray-500">UX Prototype — בחירת תפקיד לבדיקה</p>
        </div>

        <div className="space-y-3">
          <Link href="/manager">
            <Button fullWidth className="gap-2">
              <MessageCircle className="h-5 w-5" />
              כניסה כמנהל
            </Button>
          </Link>

          <Link href={`/invite/${DEMO_INVITE_TOKEN}`}>
            <Button variant="secondary" fullWidth className="gap-2">
              <UserPlus className="h-5 w-5" />
              פתיחת הזמנת עובד (דמו)
            </Button>
          </Link>

          {workers.length > 1 && (
            <div className="rounded-xl bg-[var(--jobchat-surface)] p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">
                הזמנות פעילות:
              </p>
              <ul className="space-y-2">
                {workers.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/invite/${w.inviteToken}`}
                      className="block truncate text-sm text-[var(--jobchat-accent)] underline"
                      dir="ltr"
                    >
                      /invite/{w.inviteToken} — {w.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-auto pt-8">
          <Button
            variant="outline"
            fullWidth
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            איפוס נתוני דמו
          </Button>
          <p className="mt-4 text-center text-xs text-gray-400">
            Route זה מיועד לבדיקות בלבד
          </p>
        </div>
      </div>
    </MobileFrame>
  );
}
