"use client";

import { useEffect, useState, type ComponentType } from "react";

/** Defers cross-tab sync until after the main bundle has mounted. */
export function LazyStoreSync() {
  const [Sync, setSync] = useState<ComponentType | null>(null);

  useEffect(() => {
    void import("@/components/StoreSync").then((mod) => {
      setSync(() => mod.StoreSync);
    });
  }, []);

  return Sync ? <Sync /> : null;
}
