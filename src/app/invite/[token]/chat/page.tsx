"use client";

import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { useInviteBootstrap } from "@/lib/hooks/use-slang-data";
import { getWorkerJoinPath } from "@/lib/utils";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Legacy route — redirects to invite home so worker picks a manager. */
export default function LegacyWorkerChatPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();
  const { loading } = useInviteBootstrap(token);

  useEffect(() => {
    if (!token || loading) return;
    router.replace(getWorkerJoinPath(token));
  }, [token, loading, router]);

  if (!token) notFound();

  return (
    <MobileFrame>
      <AppLoadingState />
    </MobileFrame>
  );
}
