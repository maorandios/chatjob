"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";

const PULL_THRESHOLD = 56;
const MAX_PULL = 88;

type PullToRefreshProps = {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
};

export function PullToRefresh({
  onRefresh,
  children,
  className,
  contentClassName,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  onRefreshRef.current = onRefresh;
  pullDistanceRef.current = pullDistance;

  const resetPull = useCallback(() => {
    pullingRef.current = false;
    setPullDistance(0);
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (disabled || refreshing) return;
      const el = scrollRef.current;
      if (!el || el.scrollTop > 0) return;

      startYRef.current = event.touches[0]!.clientY;
      pullingRef.current = true;
    },
    [disabled, refreshing]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!pullingRef.current || refreshing || disabled) return;

      const el = scrollRef.current;
      if (!el || el.scrollTop > 0) {
        resetPull();
        return;
      }

      const delta = event.touches[0]!.clientY - startYRef.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }

      setPullDistance(Math.min(delta * 0.45, MAX_PULL));
    },
    [disabled, refreshing, resetPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    const distance = pullDistanceRef.current;
    if (distance < PULL_THRESHOLD || refreshing || disabled) {
      setPullDistance(0);
      return;
    }

    setRefreshing(true);
    setPullDistance(PULL_THRESHOLD * 0.7);

    try {
      await onRefreshRef.current();
    } finally {
      setRefreshing(false);
      setPullDistance(0);
    }
  }, [disabled, refreshing]);

  const indicatorVisible = pullDistance > 0 || refreshing;

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {indicatorVisible && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
          style={{ height: Math.max(pullDistance, refreshing ? 40 : 0) }}
        >
          <Loader2
            className={cn(
              "h-5 w-5 text-[var(--jobchat-accent)]",
              refreshing && "animate-spin"
            )}
            style={{
              marginTop: Math.max(pullDistance - 24, 6),
              opacity: refreshing ? 1 : Math.min(pullDistance / PULL_THRESHOLD, 1),
            }}
          />
        </div>
      )}
      <div
        ref={scrollRef}
        className={cn(
          "chat-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-y-contain",
          contentClassName
        )}
        style={{
          transform: pullDistance ? `translateY(${pullDistance}px)` : undefined,
          transition: pullingRef.current ? "none" : "transform 0.2s ease",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => void handleTouchEnd()}
        onTouchCancel={resetPull}
      >
        {children}
      </div>
    </div>
  );
}
