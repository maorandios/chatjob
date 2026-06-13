"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Reads a query param on the client without `useSearchParams` (avoids Suspense hangs). */
export function useClientSearchParam(key: string, expected = "1") {
  const pathname = usePathname();
  const [value, setValue] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key) === expected);
  }, [pathname, key, expected]);

  return value;
}
