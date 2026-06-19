"use client";

import { ManagerJoinView } from "@/components/manager/ManagerJoinView";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { Button } from "@/components/ui/Button";
import { MobileFrame } from "@/components/ui/MobileFrame";
import type { Manager } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ManagerJoinPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [invitedManager, setInvitedManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    void fetch(`/api/managers/invite/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "קישור ההזמנה אינו תקין"
          );
        }
        return data.manager as Manager;
      })
      .then((manager) => {
        if (cancelled) return;
        setInvitedManager(manager);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "קישור ההזמנה אינו תקין"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) {
    return (
      <MobileFrame dir="rtl">
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="text-sm text-gray-500">קישור לא תקין</p>
        </div>
      </MobileFrame>
    );
  }

  if (loading) {
    return (
      <MobileFrame dir="rtl">
        <AppLoadingState />
      </MobileFrame>
    );
  }

  if (error || !invitedManager) {
    return (
      <MobileFrame dir="rtl">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">הזמנה לא תקינה</h1>
          <p className="text-sm text-gray-500">{error ?? "קישור ההזמנה אינו תקין"}</p>
          <Button variant="outline" onClick={() => window.location.assign("/")}>
            חזרה
          </Button>
        </div>
      </MobileFrame>
    );
  }

  return (
    <ManagerJoinView inviteToken={token} invitedManager={invitedManager} />
  );
}
