"use client";

import { Button } from "@/components/ui/Button";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { setStoredManagerId } from "@/lib/manager-session";
import { useSlangStore } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManagerJoinPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();
  const bootstrapManager = useSlangStore((s) => s.bootstrapManager);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void bootstrapManager(token)
      .then(() => {
        if (cancelled) return;
        const managerId = useSlangStore.getState().managerId;
        if (managerId) setStoredManagerId(managerId);
        router.replace("/manager");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "קישור ההזמנה אינו תקין"
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token, bootstrapManager, router]);

  if (!token) {
    return (
      <MobileFrame dir="rtl">
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="text-sm text-gray-500">קישור לא תקין</p>
        </div>
      </MobileFrame>
    );
  }

  if (error) {
    return (
      <MobileFrame dir="rtl">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">הזמנה לא תקינה</h1>
          <p className="text-sm text-gray-500">{error}</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            חזרה
          </Button>
        </div>
      </MobileFrame>
    );
  }

  return (
    <MobileFrame dir="rtl">
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-gray-500">מצטרפים ל-Slang...</p>
      </div>
    </MobileFrame>
  );
}
