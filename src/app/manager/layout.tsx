import { PageStackTransition } from "@/components/ui/PageStackTransition";
import { SlangBootstrap } from "@/components/SlangBootstrap";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { Suspense, type ReactNode } from "react";

function ManagerStack({ children }: { children: ReactNode }) {
  return <PageStackTransition dir="rtl">{children}</PageStackTransition>;
}

export default function ManagerLayout({ children }: { children: ReactNode }) {
  return (
    <SlangBootstrap>
      <MobileFrame dir="rtl" className="bg-white">
        <Suspense fallback={children}>
          <ManagerStack>{children}</ManagerStack>
        </Suspense>
      </MobileFrame>
    </SlangBootstrap>
  );
}
