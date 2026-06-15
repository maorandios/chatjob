"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { signOutSupabaseAuth } from "@/lib/auth/manager-auth";
import { useSlangStore } from "@/lib/store";
import { ChevronLeft, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutNavCard() {
  const router = useRouter();
  const logoutManager = useSlangStore((s) => s.logoutManager);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirm = async () => {
    setLoggingOut(true);
    await signOutSupabaseAuth();
    logoutManager();
    setOpen(false);
    router.replace("/manager/login");
  };

  return (
    <>
      <section>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-4 text-start transition-colors active:bg-white/40"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
            <LogOut className="h-5 w-5 text-[var(--jobchat-accent)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900">התנתקות</p>
          </div>
          <ChevronLeft className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
        </button>
      </section>

      <Sheet
        open={open}
        onClose={() => !loggingOut && setOpen(false)}
        dir="rtl"
        showCloseButton={false}
      >
        <div dir="rtl" className="space-y-5">
          <p className="text-center text-[17px] font-semibold leading-snug text-gray-900">
            האם להתנתק מהמערכת?
          </p>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setOpen(false)}
              disabled={loggingOut}
              className="!rounded-2xl text-gray-600"
            >
              ביטול
            </Button>
            <Button
              fullWidth
              onClick={handleConfirm}
              disabled={loggingOut}
              className="!rounded-2xl"
            >
              התנתק
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
