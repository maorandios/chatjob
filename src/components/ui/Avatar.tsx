import { cn } from "@/lib/utils";
import { CircleUserRound } from "lucide-react";

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  imageUrl?: string;
  className?: string;
};

const sizes = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-2xl",
};

const iconSizes = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

export function Avatar({ name, size = "md", imageUrl, className }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)] font-semibold text-[var(--jobchat-accent)]",
        sizes[size],
        className
      )}
      aria-hidden
    >
      <CircleUserRound className={iconSizes[size]} strokeWidth={1.8} />
    </div>
  );
}
