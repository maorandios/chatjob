"use client";

import { useSlangStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Redirect to login if there is no manager session. */
export function useRequireManagerSession() {
  const router = useRouter();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);

  useEffect(() => {
    if (!ready) return;
    if (!managerId) {
      router.replace("/manager/login");
    }
  }, [ready, managerId, router]);
}

/** Block app routes until admin onboarding is finished. */
export function useRequireOnboardingComplete() {
  const router = useRouter();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (!ready) return;
    if (!managerId) {
      router.replace("/manager/login");
      return;
    }
    if (!onboardingComplete) {
      router.replace("/manager/onboarding");
    }
  }, [ready, managerId, onboardingComplete, router]);
}

/** Onboarding page: send completed users to the app. */
export function useOnboardingPageGuard() {
  const router = useRouter();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const onboardingComplete = useSlangStore((s) => s.onboardingComplete);

  useEffect(() => {
    if (!ready) return;
    if (!managerId) {
      router.replace("/manager/login");
      return;
    }
    if (onboardingComplete) {
      router.replace("/manager");
    }
  }, [ready, managerId, onboardingComplete, router]);
}
