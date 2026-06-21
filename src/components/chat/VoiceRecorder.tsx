"use client";

import { RecordingOverlay } from "@/components/chat/RecordingOverlay";
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
  readyLabel = "הקלטה מוכנה",
  finishRecordingLabel = "סיים",
  deleteRecordingLabel = "מחק",
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
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
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
      setPendingBlob(null);
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
    setPendingBlob(null);
  }, [cleanupStream]);

  const stopRecordingForDecision = useCallback(
    async (options?: { autoMaxDuration?: boolean }) => {
      if (stoppingRef.current) return;

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        if (pendingBlob) return;
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

      setPendingBlob(blob);
      setElapsedMs(duration);
      stoppingRef.current = false;
    },
    [
      cleanupStream,
      errorLabel,
      maxDurationLabel,
      pendingBlob,
      showToast,
      tooShortLabel,
    ]
  );

  const finishRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecordingForDecision();
      return;
    }

    if (!pendingBlob || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      await onRecorded(pendingBlob);
    } catch (error) {
      showToast(error instanceof Error ? error.message : errorLabel);
    } finally {
      setIsAnalyzing(false);
      setElapsedMs(0);
      setPendingBlob(null);
      stoppingRef.current = false;
    }
  },
    [
      errorLabel,
      isAnalyzing,
      isRecording,
      onRecorded,
      pendingBlob,
      showToast,
      stopRecordingForDecision,
    ]
  );

  const startRecording = useCallback(async () => {
    if (disabled || isAnalyzing || isRecording || pendingBlob) return;

    try {
      setPendingBlob(null);
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
    pendingBlob,
    showToast,
  ]);

  const showOverlay = isRecording || isAnalyzing || Boolean(pendingBlob);
  const isBusy = isAnalyzing;

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
    if (disabled || isAnalyzing || isRecording || pendingBlob) return;
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

      {showOverlay && (
        <RecordingOverlay
          phase={isAnalyzing ? "analyzing" : pendingBlob ? "ready" : "recording"}
          elapsedMs={elapsedMs}
          maxSec={MAX_RECORD_SEC}
          label={pendingBlob ? "סיים או ביטול" : recordingLabel}
          readyLabel={readyLabel}
          analyzingLabel={analyzingLabel}
          finishLabel={finishRecordingLabel}
          deleteLabel={deleteRecordingLabel}
          onFinish={() => void finishRecording()}
          onDelete={() => void cancelRecording()}
          dir={dir}
        />
      )}
    </>
  );
}
