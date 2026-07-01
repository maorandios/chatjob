"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function PushNavigationListener() {
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_NAVIGATE") return;
      const url = typeof event.data.url === "string" ? event.data.url : "/";
      router.push(url);
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [router]);

  return null;
}
