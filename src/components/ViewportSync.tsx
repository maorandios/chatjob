"use client";

import { useVisualViewport } from "@/lib/hooks/use-visual-viewport";

export function ViewportSync() {
  useVisualViewport();
  return null;
}
