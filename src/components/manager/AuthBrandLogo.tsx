import Image from "next/image";
import { cn } from "@/lib/utils";

type AuthBrandLogoProps = {
  className?: string;
};

export function AuthBrandLogo({ className }: AuthBrandLogoProps) {
  return (
    <div className={cn("flex justify-center px-2", className)}>
      <Image
        src="/klinglogo.svg"
        alt="Kling"
        width={390}
        height={120}
        priority
        className="h-[5.25rem] w-auto max-w-[min(100%,420px)]"
      />
    </div>
  );
}
