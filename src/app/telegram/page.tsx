"use client";

import { MobileFrame } from "@/components/ui/MobileFrame";
import { useTelegram } from "@/components/telegram/TelegramProvider";
import { useSlangStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TelegramEntryPage() {
  const router = useRouter();
  const { ready, isTelegram, session, error } = useTelegram();
  const signInManager = useSlangStore((s) => s.signInManager);
  const bootstrapManager = useSlangStore((s) => s.bootstrapManager);
  const fetchInvite = useSlangStore((s) => s.fetchInvite);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!ready || redirectedRef.current) return;
    if (!isTelegram) return;
    if (!session) return;

    if (session.role === "unknown") return;

    redirectedRef.current = true;

    if (session.role === "manager" && session.managerId) {
      void (async () => {
        try {
          await signInManager(session.managerId!);
        } catch {
          await bootstrapManager(undefined, session.managerId);
        }
        router.replace("/manager?tg=1");
      })();
      return;
    }

    if (session.role === "worker" && session.inviteToken) {
      void (async () => {
        await fetchInvite(session.inviteToken!);
        router.replace(`/invite/${session.inviteToken}?tg=1`);
      })();
    }
  }, [
    ready,
    isTelegram,
    session,
    router,
    signInManager,
    bootstrapManager,
    fetchInvite,
  ]);

  if (!ready) {
    return (
      <MobileFrame>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">טוען...</p>
        </div>
      </MobileFrame>
    );
  }

  if (!isTelegram) {
    return (
      <MobileFrame>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Kling Telegram</h1>
          <p className="mt-2 text-sm text-gray-500">
            פתחו את האפליקציה מתוך Telegram דרך הבוט או קישור ההזמנה.
          </p>
        </div>
      </MobileFrame>
    );
  }

  if (error) {
    return (
      <MobileFrame>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">שגיאה</h1>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
        </div>
      </MobileFrame>
    );
  }

  if (session?.role === "unknown") {
    return (
      <MobileFrame>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Kling</h1>
          <p className="mt-2 text-sm text-gray-500">
            {session.message ??
              "פתחו את קישור ההזמנה שקיבלתם מהמנהל כדי להתחבר."}
          </p>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">מכין את האפליקציה...</p>
      </div>
    </MobileFrame>
  );
}
