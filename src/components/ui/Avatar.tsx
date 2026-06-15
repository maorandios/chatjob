import { cn } from "@/lib/utils";

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = "md", imageUrl, className }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
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
      {getInitials(name)}
    </div>
  );
}
