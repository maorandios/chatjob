"use client";

import { ManagerLoginView } from "@/components/manager/ManagerLoginView";
import { useSlangStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManagerLoginPage() {
  const router = useRouter();
  const ready = useSlangStore((s) => s.ready);
  const managerId = useSlangStore((s) => s.managerId);
  const loggedOut = useSlangStore((s) => s.loggedOut);

  useEffect(() => {
    if (ready && managerId) {
      router.replace("/manager");
    }
  }, [ready, managerId, router]);

  if (ready && managerId) {
    return null;
  }

  return (
    <ManagerLoginView
      banner={
        loggedOut ? "התנתקתם מהמערכת. התחברו שוב עם קוד למייל." : undefined
      }
    />
  );
}
