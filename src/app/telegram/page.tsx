"use client";

import {
  TelegramLoading,
  TelegramMessageScreen,
} from "@/components/telegram/TelegramStatus";
import { useTelegram } from "@/components/telegram/TelegramProvider";
import { useTelegramBootstrap } from "@/lib/hooks/use-telegram-bootstrap";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function TelegramEntryPage() {
  const router = useRouter();
  const { isTelegram, session } = useTelegram();
  const { appReady, worker, error } = useTelegramBootstrap();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!appReady || redirectedRef.current) return;
    if (!session || session.role === "unknown") return;

    redirectedRef.current = true;

    if (session.role === "worker" && worker && !worker.language) {
      router.replace("/telegram/onboarding");
      return;
    }

    router.replace("/telegram/inbox");
  }, [appReady, session, worker, router]);

  if (!isTelegram) {
    return (
      <TelegramMessageScreen title="Kling Telegram">
        <p>פתחו את האפליקציה מתוך Telegram דרך הבוט או קישור ההזמנה.</p>
      </TelegramMessageScreen>
    );
  }

  if (error) {
    return (
      <TelegramMessageScreen title="שגיאה">
        <p>{error}</p>
      </TelegramMessageScreen>
    );
  }

  if (session?.role === "unknown") {
    return (
      <TelegramMessageScreen title="Kling">
        <p>
          {session.message ??
            "פתחו את קישור ההזמנה שקיבלתם מהמנהל כדי להתחבר."}
        </p>
      </TelegramMessageScreen>
    );
  }

  return <TelegramLoading label="מכין את האפליקציה..." />;
}
