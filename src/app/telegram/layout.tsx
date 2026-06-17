import { TelegramProvider } from "@/components/telegram/TelegramProvider";
import Script from "next/script";
import type { ReactNode } from "react";

export default function TelegramLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="beforeInteractive"
      />
      <TelegramProvider>{children}</TelegramProvider>
    </>
  );
}
