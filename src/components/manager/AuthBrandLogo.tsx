import Image from "next/image";
import { cn } from "@/lib/utils";

type AuthBrandLogoProps = {
  className?: string;
  size?: "default" | "compact";
  variant?: "default" | "en";
};

const sizes = {
  default: {
    width: 390,
    height: 120,
    className: "h-[5.25rem] w-auto max-w-[min(100%,420px)]",
  },
  compact: {
    width: 312,
    height: 96,
    className: "h-[4.2rem] w-auto max-w-[min(100%,336px)]",
  },
};

export function AuthBrandLogo({
  className,
  size = "default",
  variant = "default",
}: AuthBrandLogoProps) {
  const dims = sizes[size];
  const src = variant === "en" ? "/klinglogo-en.svg" : "/klinglogo.svg";

  return (
    <div className={cn("flex justify-center px-2", className)}>
      <Image
        src={src}
        alt="Kling"
        width={dims.width}
        height={dims.height}
        className={dims.className}
      />
    </div>
  );
}
