"use client";

import { useIsTelegramApp } from "@/lib/telegram/use-is-telegram-app";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Sends Telegram Mini App users to the dedicated /telegram routes. */
export function TelegramWebRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const isTelegram = useIsTelegramApp();

  useEffect(() => {
    if (!isTelegram) return;
    if (pathname?.startsWith("/telegram")) return;
    router.replace("/telegram/inbox");
  }, [isTelegram, pathname, router]);

  return null;
}
