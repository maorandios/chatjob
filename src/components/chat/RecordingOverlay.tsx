"use client";

import { Portal } from "@/components/ui/Portal";
import { addModalBackdrop, removeModalBackdrop } from "@/lib/modal-backdrop";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const BAR_COUNT = 9;

type RecordingOverlayProps = {
  phase: "recording" | "ready" | "analyzing";
  elapsedMs: number;
  maxSec: number;
  label: string;
  readyLabel: string;
  analyzingLabel: string;
  finishLabel: string;
  deleteLabel: string;
  onFinish: () => void;
  onDelete: () => void;
  dir?: "ltr" | "rtl";
};

export function RecordingOverlay({
  phase,
  elapsedMs,
  maxSec,
  label,
  readyLabel,
  analyzingLabel,
  finishLabel,
  deleteLabel,
  onFinish,
  onDelete,
  dir = "rtl",
}: RecordingOverlayProps) {
  const isAnalyzing = phase === "analyzing";
  const isReady = phase === "ready";
  const progress = Math.min(elapsedMs / (maxSec * 1000), 1);

  useEffect(() => {
    addModalBackdrop();
    return () => removeModalBackdrop();
  }, []);

  return (
    <Portal>
      <div
        className="jobchat-modal-backdrop fixed inset-0 z-[9998] flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label={isAnalyzing ? analyzingLabel : label}
      >
      <div dir={dir} className="flex w-full max-w-[340px] flex-col items-center gap-8 px-8">
        <div className="relative flex h-32 w-32 items-center justify-center">
          {isAnalyzing ? (
            <>
              <span className="analyzing-ring absolute inset-0 rounded-full border-2 border-white/20" />
              <span className="analyzing-ring analyzing-ring-delay absolute inset-2 rounded-full border-2 border-white/15" />
              <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--jobchat-accent)] shadow-[0_8px_32px_rgba(0,60,255,0.45)]">
                <Loader2 className="h-8 w-8 animate-spin text-white" strokeWidth={2} />
              </div>
            </>
          ) : isReady ? (
            <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--jobchat-accent)] shadow-[0_8px_32px_rgba(0,60,255,0.35)]">
              <div className="flex h-8 items-end justify-center gap-[3px]">
                {[16, 24, 32, 22, 28, 18, 26, 20, 30].map((height, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-white"
                    style={{ height }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <>
              <span className="recording-pulse-ring absolute inset-0 rounded-full bg-[var(--jobchat-accent)]/25" />
              <span className="recording-pulse-ring recording-pulse-ring-delay absolute inset-3 rounded-full bg-[var(--jobchat-accent)]/20" />
              <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--jobchat-accent)] shadow-[0_8px_32px_rgba(0,60,255,0.45)]">
                <div className="flex h-10 items-end justify-center gap-[3px]">
                  {Array.from({ length: BAR_COUNT }).map((_, i) => (
                    <span
                      key={i}
                      className="recording-bar w-[3px] rounded-full bg-white"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="text-center">
          {(isAnalyzing || !isReady) && (
            <p className="text-base font-medium text-white/90">
              {isAnalyzing ? analyzingLabel : label}
            </p>
          )}

          {isAnalyzing ? (
            <div className="mx-auto mt-5 flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="analyzing-dot h-2 w-2 rounded-full bg-white/80"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          ) : (
            <>
              {isReady ? (
                <p className="mt-5 text-lg font-semibold text-white">
                  {readyLabel}
                </p>
              ) : (
                <div className="mx-auto mt-5 h-1.5 w-64 overflow-hidden rounded-full bg-white/20">
                  <div
                    className={cn(
                      "h-full rounded-full bg-white transition-[width] duration-100 ease-linear",
                      progress >= 1 && "bg-amber-300"
                    )}
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {isReady && !isAnalyzing && (
          <div className="w-full max-w-[300px] rounded-full bg-white/[0.10] p-1.5 backdrop-blur-xl ring-1 ring-white/10">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={onFinish}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-[15px] font-semibold text-white shadow-[0_4px_20px_rgba(0,60,255,0.35)] transition-all active:scale-[0.98]"
              >
                {finishLabel}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-white/15 text-[15px] font-semibold text-white/80 transition-all hover:bg-white/20 active:scale-[0.98]"
              >
                {deleteLabel}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </Portal>
  );
}
