"use client";

import { type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Portals overlays directly to body — never use a full-screen fixed wrapper (breaks iOS 15 touch). */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
