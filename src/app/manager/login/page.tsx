"use client";

import { ManagerLoginView } from "@/components/manager/ManagerLoginView";
import { AppShell } from "@/components/ui/AppShell";
import { getPostAuthManagerPath } from "@/lib/auth/post-auth-redirect";
import { useSlangStore } from "@/lib/store";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagerLoginPage() {
  const router = useRouter();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (ready && managerId) {
      router.replace(getPostAuthManagerPath(onboardingComplete));
    }
  }, [ready, managerId, onboardingComplete, router]);

  if (ready && managerId) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] safe-top">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--jobchat-accent)]" />
          <p className="mt-4 text-sm text-gray-500">מעבירים אותך הלאה...</p>
        </div>
      </AppShell>
    );
  }

  return <ManagerLoginView />;
}
