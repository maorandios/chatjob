"use client";

import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { Mic, Square } from "lucide-react";
import { useCallback, useRef, useState } from "react";

const MIN_RECORD_MS = 800;

type VoiceRecorderProps = {
  onRecorded: (blob: Blob) => Promise<void>;
  disabled?: boolean;
  processingLabel?: string;
  recordingLabel?: string;
  errorLabel?: string;
  tooShortLabel?: string;
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
  recordingLabel = "מקליט...",
  errorLabel = "לא ניתן לגשת למיקרופון",
  tooShortLabel = "הקלטה קצרה מדי — החזק עוד קצת",
  dir = "rtl",
}: VoiceRecorderProps) {
  const { showToast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordStartRef = useRef<number>(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

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

    if (duration < MIN_RECORD_MS) {
      showToast(tooShortLabel);
      return;
    }

    if (blob.size === 0) {
      showToast(errorLabel);
      return;
    }

    setIsProcessing(true);
    try {
      await onRecorded(blob);
    } catch (error) {
      showToast(error instanceof Error ? error.message : errorLabel);
    } finally {
      setIsProcessing(false);
    }
  }, [cleanupStream, errorLabel, onRecorded, showToast, tooShortLabel]);

  const startRecording = useCallback(async () => {
    if (disabled || isProcessing || isRecording) return;

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
      recorder.start(250);
      setIsRecording(true);
      showToast(recordingLabel);
    } catch {
      cleanupStream();
      showToast(errorLabel);
    }
  }, [
    cleanupStream,
    disabled,
    errorLabel,
    isProcessing,
    isRecording,
    recordingLabel,
    showToast,
  ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    void startRecording();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isRecording) void stopRecording();
  };

  const handlePointerLeave = () => {
    if (isRecording) void stopRecording();
  };

  return (
    <button
      type="button"
      dir={dir}
      disabled={disabled || isProcessing}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      className={cn(
        "mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
        isRecording
          ? "bg-red-500 text-white animate-pulse"
          : isProcessing
            ? "bg-gray-300 text-gray-500"
            : "text-gray-500 hover:bg-gray-200"
      )}
      aria-label={isRecording ? recordingLabel : "Voice message"}
    >
      {isRecording ? (
        <Square className="h-4 w-4 fill-current" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
      {isProcessing && (
        <span className="sr-only">{processingLabel}</span>
      )}
    </button>
  );
}
