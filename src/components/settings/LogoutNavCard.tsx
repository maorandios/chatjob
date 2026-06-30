"use client";

import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { signOutSupabaseAuth } from "@/lib/auth/manager-auth";
import { unsubscribeCurrentPushDevice } from "@/lib/hooks/use-push-notifications";
import { useSlangStore } from "@/lib/store";
import { ChevronLeft, LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutNavCard() {
  const router = useRouter();
  const logoutManager = useSlangStore((s) => s.logoutManager);
  const deleteManagerAccount = useSlangStore((s) => s.deleteManagerAccount);
  const managerId = useSlangStore((s) => s.managerId);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setLoggingOut(true);
    await unsubscribeCurrentPushDevice({
      userRole: "manager",
      userId: managerId ?? undefined,
    }).catch((error) => {
      console.warn("[Slang] Failed to unsubscribe push on logout", error);
    });
    await signOutSupabaseAuth();
    setOpen(false);
    router.replace("/login");
    logoutManager();
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await unsubscribeCurrentPushDevice({
        userRole: "manager",
        userId: managerId ?? undefined,
      }).catch((error) => {
        console.warn("[Slang] Failed to unsubscribe push on account delete", error);
      });
      await deleteManagerAccount();
      await signOutSupabaseAuth();
      setDeleteOpen(false);
      router.replace("/login");
    } finally {
      setDeleting(false);
    }
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

      <section>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-4 py-4 text-start transition-colors active:bg-red-50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-700">מחיקת החשבון שלי</p>
            <p className="mt-0.5 text-xs text-red-400">הסרה מהאפליקציה</p>
          </div>
          <ChevronLeft className="h-5 w-5 shrink-0 text-red-300" aria-hidden />
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

      <Sheet
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        dir="rtl"
        showCloseButton={false}
      >
        <div dir="rtl" className="space-y-5">
          <div className="text-center">
            <p className="text-[17px] font-semibold leading-snug text-gray-900">
              למחוק את החשבון שלך?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              החשבון שלך יוסר מהאפליקציה ולא תהיה לך גישה לשיחות דרך המשתמש הזה.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              className="!rounded-2xl text-gray-600"
            >
              ביטול
            </Button>
            <Button
              fullWidth
              onClick={() => void handleDeleteConfirm()}
              disabled={deleting}
              className="!rounded-2xl bg-red-500 hover:bg-red-600"
            >
              מחק חשבון
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
