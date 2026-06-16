"use client";

import { ManagerLoginView } from "@/components/manager/ManagerLoginView";
import { getPostAuthManagerPath } from "@/lib/auth/post-auth-redirect";
import { useSlangStore } from "@/lib/store";
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
    return null;
  }

  return <ManagerLoginView />;
}
