"use client";

import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { WorkerSettingsView } from "@/components/settings/WorkerSettingsView";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import type { LanguageCode } from "@/types";
import { notFound, useParams } from "next/navigation";

export default function WorkerSettingsPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const { loading, worker } = useInviteBootstrap(token);

  if (!token) notFound();

  if (loading) {
    return (
      <MobileFrame>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </MobileFrame>
    );
  }

  if (!worker?.language) notFound();

  const language = worker.language as LanguageCode;
  const dir = getLanguageDir(language);
  const ui = getWorkerUi(language);

  return (
    <MobileFrame dir={dir}>
      <SettingsScreenHeader
        title={ui.settings}
        backHref={`/invite/${token}`}
        dir={dir}
      />
      <WorkerSettingsView
        token={token}
        workerName={worker.name}
        language={language}
        dir={dir}
      />
    </MobileFrame>
  );
}
