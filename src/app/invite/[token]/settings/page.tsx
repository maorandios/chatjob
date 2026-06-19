"use client";

import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { WorkerSettingsView } from "@/components/settings/WorkerSettingsView";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
import { useContactDisplayName } from "@/lib/store";
import { getWorkerJoinPath } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function WorkerSettingsPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();
  const { loading, worker, authRequired } = useInviteBootstrap(token);

  useEffect(() => {
    if (authRequired) {
      router.replace(getWorkerJoinPath(token));
    }
  }, [authRequired, router, token]);

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
  const workerDisplayName = useContactDisplayName("worker", worker.id, worker.name);

  return (
    <MobileFrame dir={dir}>
      <SettingsScreenHeader
        title={ui.settings}
        backHref={getWorkerJoinPath(token)}
        dir={dir}
      />
      <WorkerSettingsView
        token={token}
        workerId={worker.id}
        workerName={workerDisplayName}
        workerImageUrl={worker.profileImageUrl}
        language={language}
        dir={dir}
      />
    </MobileFrame>
  );
}
