"use client";

import { startParamFromMiniAppSearch } from "@/lib/telegram/config";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type TelegramSessionPayload = {
  role: "manager" | "worker" | "unknown";
  managerId?: string;
  inviteToken?: string;
  message?: string;
};

type TelegramContextValue = {
  ready: boolean;
  isTelegram: boolean;
  initData: string;
  startParam?: string;
  session: TelegramSessionPayload | null;
  error: string | null;
  refreshSession: () => Promise<void>;
};

const TelegramContext = createContext<TelegramContextValue | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [initData, setInitData] = useState("");
  const [startParam, setStartParam] = useState<string | undefined>();
  const [launchStartParam, setLaunchStartParam] = useState<string | undefined>();
  const [session, setSession] = useState<TelegramSessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    if (!initData) return;

    const res = await fetch("/api/telegram/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initData,
        startParam: launchStartParam,
        search: typeof window !== "undefined" ? window.location.search : "",
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Telegram session failed"
      );
    }

    const resolved = data.session as
      | { role: "manager"; managerId: string; inviteToken: string }
      | { role: "worker"; workerId: string; inviteToken: string }
      | { role: "unknown"; message: string };

    if (resolved.role === "manager") {
      setSession({
        role: "manager",
        managerId: resolved.managerId,
        inviteToken: resolved.inviteToken,
      });
      return;
    }

    if (resolved.role === "worker") {
      setSession({
        role: "worker",
        inviteToken: resolved.inviteToken,
      });
      return;
    }

    setSession({
      role: "unknown",
      message: resolved.message,
    });
  }, [initData, launchStartParam]);

  useEffect(() => {
    let cancelled = false;

    void import("@twa-dev/sdk")
      .then(({ default: WebApp }) => {
        if (cancelled) return;
        WebApp.ready();
        WebApp.expand();
        setIsTelegram(Boolean(WebApp.initData));
        setInitData(WebApp.initData ?? "");
        const fromUrl = startParamFromMiniAppSearch(window.location.search);
        const fromTelegram = WebApp.initDataUnsafe.start_param?.trim();
        setStartParam(fromUrl ?? fromTelegram);
        setLaunchStartParam(fromUrl ?? fromTelegram);
        document.documentElement.style.setProperty(
          "--tg-theme-bg-color",
          WebApp.themeParams.bg_color ?? "#f5f6f8"
        );
      })
      .catch(() => {
        if (!cancelled) setIsTelegram(false);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!initData) return;

    void refreshSession().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Telegram session failed");
    });
  }, [initData, launchStartParam, refreshSession]);

  const value = useMemo(
    () => ({
      ready,
      isTelegram,
      initData,
      startParam,
      session,
      error,
      refreshSession,
    }),
    [ready, isTelegram, initData, startParam, session, error, refreshSession]
  );

  return (
    <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error("useTelegram must be used within TelegramProvider");
  }
  return context;
}
