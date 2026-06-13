"use client";

import { type ReactNode } from "react";
import { createPortal } from "react-dom";

const OVERLAY_ROOT_ID = "jobchat-overlays";

export function getOverlayRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById(OVERLAY_ROOT_ID) ?? document.body;
}

export function Portal({ children }: { children: ReactNode }) {
  const root = getOverlayRoot();
  if (!root) return null;
  return createPortal(children, root);
}
