"use client";

import { Button } from "@/components/ui/Button";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { LanguagePicker } from "@/components/worker/LanguagePicker";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import {
  useInviteByToken,
  useJobChatStore,
  useWorkerByToken,
} from "@/lib/mock/store";
import type { LanguageCode } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";

type PageProps = {
  params: Promise<{ token: string }>;
};

function InvitePageContent({ token }: { token: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isChangingLanguage = searchParams.get("changeLang") === "1";
  const setWorkerLanguage = useJobChatStore((s) => s.setWorkerLanguage);
  const worker = useWorkerByToken(token);
  const invite = useInviteByToken(token);

  const [selectedLang, setSelectedLang] = useState<LanguageCode | undefined>(
    worker?.language
  );

  useEffect(() => {
    if (
      worker?.language &&
      worker.status === "active" &&
      !isChangingLanguage
    ) {
      router.replace(`/invite/${token}/chat`);
    }
  }, [worker, token, router, isChangingLanguage]);

  if (!worker || !invite) {
    return (
      <MobileFrame>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">הזמנה לא תקינה</h1>
          <p className="mt-2 text-sm text-gray-500">
            קישור ההזמנה אינו פעיל
          </p>
        </div>
      </MobileFrame>
    );
  }

  const previewLang = selectedLang ?? "en";
  const ui = getWorkerUi(previewLang);
  const dir = getLanguageDir(previewLang);

  const handleContinue = () => {
    if (!selectedLang) return;
    setWorkerLanguage(worker.id, selectedLang);
    router.push(`/invite/${token}/chat`);
  };

  return (
    <MobileFrame dir={dir}>
      <div className="flex min-h-dvh flex-col px-5 pb-6 pt-10 safe-top">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366] text-lg font-bold text-white">
            JC
          </div>
          <p className="text-sm text-gray-500">{ui.invitedBy}</p>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">
            {invite.managerName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{ui.invitedToJobChat}</p>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isChangingLanguage ? ui.changeLanguage : ui.chooseLanguage}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {ui.chooseLanguageSubtitle}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <LanguagePicker selected={selectedLang} onSelect={setSelectedLang} />
        </div>

        <div className="mt-6 safe-bottom">
          <Button fullWidth disabled={!selectedLang} onClick={handleContinue}>
            {selectedLang ? ui.joinChat : ui.continue}
          </Button>
        </div>
      </div>
    </MobileFrame>
  );
}

export default function InvitePage({ params }: PageProps) {
  const { token } = use(params);

  return (
    <Suspense
      fallback={
        <MobileFrame>
          <div className="flex min-h-dvh items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#25D366] border-t-transparent" />
          </div>
        </MobileFrame>
      }
    >
      <InvitePageContent token={token} />
    </Suspense>
  );
}
