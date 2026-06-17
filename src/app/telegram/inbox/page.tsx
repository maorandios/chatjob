"use client";

import { ChatListItem } from "@/components/manager/ChatListItem";
import { ContactSearchField } from "@/components/manager/ContactSearchField";
import { TelegramInboxHeader } from "@/components/telegram/TelegramInboxHeader";
import { TelegramShell } from "@/components/telegram/TelegramShell";
import {
  TelegramLoading,
  TelegramMessageScreen,
} from "@/components/telegram/TelegramStatus";
import { ManagerChatListItem } from "@/components/worker/ManagerChatListItem";
import { filterWorkersByQuery } from "@/lib/contacts/filter-workers";
import {
  useManagerInboxPreviews,
  useWorkerInboxPreviews,
} from "@/lib/hooks/use-slang-data";
import { useTelegramBootstrap } from "@/lib/hooks/use-telegram-bootstrap";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useSlangStore } from "@/lib/store";
import type { LanguageCode } from "@/types";
import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function TelegramInboxPage() {
  const router = useRouter();
  const { appReady, session, worker, error, isTelegram } = useTelegramBootstrap();
  const managerId = useSlangStore((s) => s.managerId);
  const companyName = useSlangStore((s) => s.companyName);
  const workers = useSlangStore((s) => s.workers);
  const managers = useSlangStore((s) => s.managers);
  const contactAliases = useSlangStore((s) => s.contactAliases);
  const [searchQuery, setSearchQuery] = useState("");

  useManagerInboxPreviews();
  useWorkerInboxPreviews(worker?.id);

  useEffect(() => {
    if (!appReady) return;
    if (session?.role === "worker" && worker && !worker.language) {
      router.replace("/telegram/onboarding");
    }
  }, [appReady, session, worker, router]);

  const filteredWorkers = useMemo(
    () => filterWorkersByQuery(workers, searchQuery, contactAliases),
    [workers, searchQuery, contactAliases]
  );

  if (!isTelegram) {
    return (
      <TelegramMessageScreen title="Kling Telegram">
        <p>פתחו את העמוד מתוך Telegram.</p>
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

  if (!appReady) {
    return <TelegramLoading />;
  }

  if (!session || session.role === "unknown") {
    return (
      <TelegramMessageScreen title="Kling">
        <p>
          {session?.message ??
            "פתחו את קישור ההזמנה שקיבלתם מהמנהל כדי להתחבר."}
        </p>
      </TelegramMessageScreen>
    );
  }

  if (session.role === "manager" && managerId) {
    return (
      <TelegramShell dir="rtl">
        <TelegramInboxHeader title="שיחות" subtitle={companyName} dir="rtl" />

        {workers.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  "var(--tg-theme-secondary-bg-color, var(--jobchat-accent-light))",
              }}
            >
              <MessageCircle
                className="h-10 w-10"
                style={{ color: "var(--tg-theme-button-color, var(--jobchat-accent))" }}
              />
            </div>
            <h2 className="text-lg font-semibold">אין עובדים עדיין</h2>
            <p className="mt-2 text-sm opacity-70">
              הוסיפו עובדים מהאתר ושלחו להם קישור Telegram.
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 px-3 pb-3 pt-2">
              <ContactSearchField value={searchQuery} onChange={setSearchQuery} />
            </div>
            <div className="chat-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
              {filteredWorkers.map((item) => (
                <ChatListItem
                  key={item.id}
                  worker={item}
                  variant="telegram"
                  chatHref={`/telegram/chat/${item.id}`}
                />
              ))}
              {filteredWorkers.length === 0 && (
                <p className="py-10 text-center text-sm opacity-60">
                  לא נמצאו אנשי קשר
                </p>
              )}
            </div>
          </>
        )}
      </TelegramShell>
    );
  }

  if (session.role === "worker" && worker?.language && session.inviteToken) {
    const lang = worker.language as LanguageCode;
    const ui = getWorkerUi(lang);
    const dir = getLanguageDir(lang);

    return (
      <TelegramShell dir={dir}>
        <TelegramInboxHeader
          title="Kling"
          subtitle={companyName}
          dir={dir}
          settingsHref="/telegram/onboarding?changeLang=1"
        />

        <div className="chat-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
          {managers.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
              <p className="text-sm opacity-60">{companyName}</p>
              <p className="mt-2 text-base font-medium">אין מנהלים זמינים עדיין</p>
            </div>
          ) : (
            managers.map((manager) => (
              <ManagerChatListItem
                key={manager.id}
                inviteToken={session.inviteToken!}
                workerId={worker.id}
                manager={manager}
                workerLanguage={lang}
                emptyPreview={ui.noMessagesYet}
                variant="telegram"
                chatHref={`/telegram/chat/${manager.id}`}
              />
            ))
          )}
        </div>
      </TelegramShell>
    );
  }

  return <TelegramLoading />;
}
