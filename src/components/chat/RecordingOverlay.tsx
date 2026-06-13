"use client";

import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const BAR_COUNT = 5;

type RecordingOverlayProps = {
  phase: "recording" | "analyzing";
  elapsedMs: number;
  maxSec: number;
  label: string;
  analyzingLabel: string;
  finishLabel: string;
  deleteLabel: string;
  onFinish: () => void;
  onDelete: () => void;
  dir?: "ltr" | "rtl";
};

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecordingOverlay({
  phase,
  elapsedMs,
  maxSec,
  label,
  analyzingLabel,
  finishLabel,
  deleteLabel,
  onFinish,
  onDelete,
  dir = "rtl",
}: RecordingOverlayProps) {
  const isAnalyzing = phase === "analyzing";
  const progress = Math.min(elapsedMs / (maxSec * 1000), 1);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[250] flex animate-in fade-in items-center justify-center bg-black/50 duration-200 motion-reduce:animate-none"
        role="dialog"
        aria-modal="true"
        aria-label={isAnalyzing ? analyzingLabel : label}
      >
      <div dir={dir} className="flex flex-col items-center gap-8 px-8">
        <div className="relative flex h-32 w-32 items-center justify-center">
          {isAnalyzing ? (
            <>
              <span className="analyzing-ring absolute inset-0 rounded-full border-2 border-white/20" />
              <span className="analyzing-ring analyzing-ring-delay absolute inset-2 rounded-full border-2 border-white/15" />
              <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--jobchat-accent)] shadow-[0_8px_32px_rgba(0,60,255,0.45)]">
                <Loader2 className="h-8 w-8 animate-spin text-white" strokeWidth={2} />
              </div>
            </>
          ) : (
            <>
              <span className="recording-pulse-ring absolute inset-0 rounded-full bg-[var(--jobchat-accent)]/25" />
              <span className="recording-pulse-ring recording-pulse-ring-delay absolute inset-3 rounded-full bg-[var(--jobchat-accent)]/20" />
              <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[var(--jobchat-accent)] shadow-[0_8px_32px_rgba(0,60,255,0.45)]">
                <div className="flex h-8 items-end justify-center gap-[3px]">
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
          <p className="text-base font-medium text-white/90">
            {isAnalyzing ? analyzingLabel : label}
          </p>

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
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white">
                {formatElapsed(elapsedMs)}
                <span className="text-lg font-normal text-white/50">
                  {" "}
                  / {maxSec}s
                </span>
              </p>
              <div className="mx-auto mt-4 h-1 w-52 overflow-hidden rounded-full bg-white/20">
                <div
                  className={cn(
                    "h-full rounded-full bg-white transition-[width] duration-100 ease-linear",
                    progress >= 1 && "bg-amber-300"
                  )}
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </>
          )}
        </div>

        {!isAnalyzing && (
          <div className="w-full max-w-[300px] rounded-[20px] bg-white/[0.08] p-2 backdrop-blur-xl ring-1 ring-white/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onFinish}
                className="flex h-12 flex-1 items-center justify-center rounded-[14px] bg-[var(--jobchat-accent)] text-[15px] font-semibold text-white shadow-[0_4px_20px_rgba(0,60,255,0.35)] transition-all active:scale-[0.98]"
              >
                {finishLabel}
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex h-12 flex-1 items-center justify-center rounded-[14px] bg-white/10 text-[15px] font-medium text-white/80 transition-all hover:bg-white/15 active:scale-[0.98]"
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
