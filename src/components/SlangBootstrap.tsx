"use client";

import { useManagerBootstrap } from "@/lib/hooks/use-slang-data";

export function SlangBootstrap({ children }: { children: React.ReactNode }) {
  useManagerBootstrap();
  return children;
}
