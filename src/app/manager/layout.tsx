import { SlangBootstrap } from "@/components/SlangBootstrap";
import { MobileFrame } from "@/components/ui/MobileFrame";
import type { ReactNode } from "react";

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <SlangBootstrap>
      <MobileFrame dir="rtl" className="bg-white">
        {children}
      </MobileFrame>
    </SlangBootstrap>
  );
}
