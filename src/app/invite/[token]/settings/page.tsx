"use client";

import { SettingsScreenHeader } from "@/components/settings/SettingsScreenHeader";
import { WorkerSettingsView } from "@/components/settings/WorkerSettingsView";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { getWorkerUi } from "@/lib/i18n/worker-ui";
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
        <AppLoadingState />
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
        backHref={getWorkerJoinPath(token)}
        dir={dir}
      />
      <WorkerSettingsView
        token={token}
        workerId={worker.id}
        workerName={worker.name}
        workerEmail={worker.email}
        workerImageUrl={worker.profileImageUrl}
        language={language}
        dir={dir}
      />
    </MobileFrame>
  );
}
