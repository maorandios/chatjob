"use client";

import { RecordingOverlay } from "@/components/chat/RecordingOverlay";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Loader2, Mic } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const MIN_RECORD_MS = 800;
const MAX_RECORD_SEC = 20;
const MAX_RECORD_MS = MAX_RECORD_SEC * 1000;

type VoiceRecorderProps = {
  onRecorded: (blob: Blob) => Promise<void>;
  disabled?: boolean;
  processingLabel?: string;
  analyzingLabel?: string;
  recordingLabel?: string;
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);
  const stoppingRef = useRef(false);
  const autoStoppedRef = useRef(false);

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

  const finishRecording = useCallback(
    async (options?: { autoMaxDuration?: boolean }) => {
      if (stoppingRef.current) return;

      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        setElapsedMs(0);
        return;
      }

      stoppingRef.current = true;
      autoStoppedRef.current = Boolean(options?.autoMaxDuration);

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

      if (autoStoppedRef.current) {
        showToast(maxDurationLabel);
      }

      if (duration < MIN_RECORD_MS) {
        showToast(tooShortLabel);
        setElapsedMs(0);
        stoppingRef.current = false;
        autoStoppedRef.current = false;
        return;
      }

      if (blob.size === 0) {
        showToast(errorLabel);
        setElapsedMs(0);
        stoppingRef.current = false;
        autoStoppedRef.current = false;
        return;
      }

      setIsAnalyzing(true);
      try {
        await onRecorded(blob);
      } catch (error) {
        showToast(error instanceof Error ? error.message : errorLabel);
      } finally {
        setIsAnalyzing(false);
        setElapsedMs(0);
        stoppingRef.current = false;
        autoStoppedRef.current = false;
      }
    },
    [cleanupStream, errorLabel, maxDurationLabel, onRecorded, showToast, tooShortLabel]
  );

  const startRecording = useCallback(async () => {
    if (disabled || isAnalyzing || isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
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
  }, [cleanupStream, disabled, errorLabel, isAnalyzing, isRecording, showToast]);

  const showOverlay = isRecording || isAnalyzing;
  const isBusy = isAnalyzing;

  useEffect(() => {
    if (!isRecording) return;

    const tick = setInterval(() => {
      const elapsed = Date.now() - recordStartRef.current;
      setElapsedMs(elapsed);

      if (elapsed >= MAX_RECORD_MS) {
        clearInterval(tick);
        void finishRecording({ autoMaxDuration: true });
      }
    }, 100);

    return () => clearInterval(tick);
  }, [isRecording, finishRecording]);

  const handleMicClick = () => {
    if (disabled || isAnalyzing || isRecording) return;
    void startRecording();
  };

  return (
    <>
      <button
        type="button"
        dir={dir}
        disabled={disabled || isBusy}
        onClick={handleMicClick}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all active:scale-95",
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
        aria-label="Voice message"
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
          phase={isAnalyzing ? "analyzing" : "recording"}
          elapsedMs={elapsedMs}
          maxSec={MAX_RECORD_SEC}
          label={recordingLabel}
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
