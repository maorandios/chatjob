"use client";

import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Loader2, Mic } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const MIN_RECORD_MS = 800;
const MAX_RECORD_SEC = 20;
const MAX_RECORD_MS = MAX_RECORD_SEC * 1000;

type VoiceRecorderProps = {
  onRecorded: (blob: Blob) => Promise<void>;
  disabled?: boolean;
  processingLabel?: string;
  analyzingLabel?: string;
  recordingLabel?: string;
  readyLabel?: string;
  finishRecordingLabel?: string;
  deleteRecordingLabel?: string;
  maxDurationLabel?: string;
  errorLabel?: string;
  tooShortLabel?: string;
  prominent?: boolean;
  dir?: "ltr" | "rtl";
};

function getSupportedMimeType(): string {
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "";
}

export function VoiceRecorder({
  onRecorded,
  disabled,
  processingLabel = "מעבד...",
  analyzingLabel = "ממיר הקלטה לטקסט",
  recordingLabel = "מקליט...",
  maxDurationLabel = "הגעת למקסימום 20 שניות",
  errorLabel = "לא ניתן לגשת למיקרופון",
  tooShortLabel = "הקלטה קצרה מדי — נסה שוב",
  prominent = false,
  dir = "rtl",
}: VoiceRecorderProps) {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);
  const stoppingRef = useRef(false);
  const isPressingRef = useRef(false);
  const pressTokenRef = useRef(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const cancelRecording = useCallback(async () => {
    if (stoppingRef.current) return;

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      setElapsedMs(0);
      return;
    }

    stoppingRef.current = true;
    setIsRecording(false);
    setElapsedMs(0);

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    cleanupStream();
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    stoppingRef.current = false;
  }, [cleanupStream]);

  const stopRecordingForDecision = useCallback(
    async (options?: { autoMaxDuration?: boolean }) => {
      if (stoppingRef.current) return;

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        setElapsedMs(0);
        return;
      }

      stoppingRef.current = true;

      const duration = Date.now() - recordStartRef.current;
      setIsRecording(false);

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      cleanupStream();

      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      mediaRecorderRef.current = null;

      if (options?.autoMaxDuration) {
        showToast(maxDurationLabel);
      }

      if (duration < MIN_RECORD_MS) {
        showToast(tooShortLabel);
        setElapsedMs(0);
        stoppingRef.current = false;
        return;
      }

      if (blob.size === 0) {
        showToast(errorLabel);
        setElapsedMs(0);
        stoppingRef.current = false;
        return;
      }

      setElapsedMs(duration);
      setIsAnalyzing(true);
      stoppingRef.current = false;
      try {
        await onRecorded(blob);
      } catch (error) {
        showToast(error instanceof Error ? error.message : errorLabel);
      } finally {
        setIsAnalyzing(false);
        setElapsedMs(0);
      }
    },
    [
      cleanupStream,
      errorLabel,
      maxDurationLabel,
      onRecorded,
      showToast,
      tooShortLabel,
    ]
  );

  const startRecording = useCallback(async () => {
    if (disabled || isAnalyzing || isRecording) return;

    try {
      const pressToken = pressTokenRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      if (!isPressingRef.current || pressToken !== pressTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = recorder;
      recordStartRef.current = Date.now();
      setElapsedMs(0);
      recorder.start(250);
      setIsRecording(true);
    } catch {
      cleanupStream();
      showToast(errorLabel);
    }
  }, [
    cleanupStream,
    disabled,
    errorLabel,
    isAnalyzing,
    isRecording,
    showToast,
  ]);

  const isBusy = isAnalyzing;
  const isActive = isRecording || isAnalyzing;
  const progress = Math.min(elapsedMs / MAX_RECORD_MS, 1);

  useEffect(() => {
    if (!isRecording) return;

    const tick = setInterval(() => {
      const elapsed = Date.now() - recordStartRef.current;
      setElapsedMs(elapsed);

      if (elapsed >= MAX_RECORD_MS) {
        clearInterval(tick);
        void stopRecordingForDecision({ autoMaxDuration: true });
      }
    }, 100);

    return () => clearInterval(tick);
  }, [isRecording, stopRecordingForDecision]);

  const handlePressStart = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || isAnalyzing || isRecording) return;
    event.preventDefault();
    isPressingRef.current = true;
    pressTokenRef.current += 1;
    event.currentTarget.setPointerCapture(event.pointerId);
    void startRecording();
  };

  const handlePressEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isPressingRef.current) return;
    event.preventDefault();
    isPressingRef.current = false;
    pressTokenRef.current += 1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    void stopRecordingForDecision();
  };

  const handlePressCancel = () => {
    isPressingRef.current = false;
    pressTokenRef.current += 1;
    void cancelRecording();
  };

  return (
    <>
      <button
        type="button"
        dir={dir}
        disabled={disabled || isBusy}
        onPointerDown={handlePressStart}
        onPointerUp={handlePressEnd}
        onPointerCancel={handlePressCancel}
        onContextMenu={(event) => event.preventDefault()}
        className={cn(
          "flex h-11 w-11 shrink-0 touch-none select-none items-center justify-center rounded-full transition-all active:scale-95",
          isRecording
            ? "bg-red-500 text-white"
            : isBusy
              ? prominent
                ? "bg-[var(--jobchat-accent)] text-white opacity-80"
                : "bg-gray-200 text-gray-400"
              : prominent
                ? "bg-[var(--jobchat-accent)] text-white hover:brightness-105"
                : "text-[var(--jobchat-accent)] hover:bg-[var(--jobchat-accent-light)]"
        )}
        aria-label="Hold to record voice message"
        aria-pressed={isRecording}
      >
        {isBusy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Mic className="h-5 w-5" strokeWidth={2.25} />
        )}
        {isBusy && (
          <span className="sr-only">{processingLabel}</span>
        )}
      </button>

      {isActive && (
        <div
          dir={dir}
          className="pointer-events-none absolute inset-x-3 top-1/2 z-10 -translate-y-1/2 rounded-[26px] border border-[var(--jobchat-border)] bg-white px-3 py-2 shadow-[0_4px_18px_rgba(15,23,42,0.10)]"
          aria-live="polite"
        >
          <div className="flex min-h-11 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--jobchat-accent)] text-white">
              {isAnalyzing ? (
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
              ) : (
                <Mic className="h-[18px] w-[18px]" strokeWidth={2.25} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-800">
                {isAnalyzing ? analyzingLabel : recordingLabel}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--jobchat-accent-light)]">
                <div
                  className={cn(
                    "h-full rounded-full bg-[var(--jobchat-accent)] transition-[width] duration-100 ease-linear",
                    isAnalyzing && "animate-pulse"
                  )}
                  style={{ width: `${isAnalyzing ? 100 : progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
