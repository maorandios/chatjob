"use client";

import { ImageLightbox } from "@/components/chat/ImageLightbox";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { Check, CheckCheck, ExternalLink, Loader2, MapPin, Mic } from "lucide-react";
import { useState } from "react";

type MessageBubbleProps = {
  message: Message;
  displayText: string;
  isOwn: boolean;
  showStatus?: boolean;
};

function StatusRow({
  message,
  isOwn,
  showStatus,
  className,
}: {
  message: Message;
  isOwn: boolean;
  showStatus: boolean;
  className?: string;
}) {
  const isVoice = message.inputType === "voice";

  return (
    <div className={cn("flex items-center justify-end gap-1 leading-none", className)}>
      {isVoice && (
        <Mic className="h-3 w-3 shrink-0" strokeWidth={2} />
      )}
      <span className="text-[11px] tabular-nums">
        {formatTime(message.createdAt)}
      </span>
      {showStatus && isOwn && (
        <span className="flex items-center">
          {message.status === "sending" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : message.status === "failed" ? (
            <span className="text-[10px] font-bold text-red-200">!</span>
          ) : message.status === "delivered" ? (
            <CheckCheck className="h-3 w-3" strokeWidth={2.5} />
          ) : (
            <Check className="h-3 w-3 opacity-80" strokeWidth={2.5} />
          )}
        </span>
      )}
    </div>
  );
}

export function MessageBubble({
  message,
  displayText,
  isOwn,
  showStatus = false,
}: MessageBubbleProps) {
  const isImage = message.inputType === "image" && message.imageUrl;
  const isLocation =
    message.inputType === "location" &&
    typeof message.locationLat === "number" &&
    typeof message.locationLng === "number";
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const canOpenLightbox = isImage && message.status !== "sending";
  const locationUrl = isLocation
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${message.locationLat},${message.locationLng}`
      )}`
    : "";

  return (
    <div
      className={cn(
        "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("max-w-[85%]", isOwn ? "items-end" : "items-start")}>
        {isImage ? (
          <>
            <button
              type="button"
              disabled={!canOpenLightbox}
              onClick={() => setLightboxOpen(true)}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-2xl text-start",
                isOwn ? "rounded-br-sm" : "rounded-bl-sm",
                canOpenLightbox && "cursor-zoom-in touch-manipulation active:opacity-95"
              )}
              style={{
                width: "min(240px, 70vw)",
                height: "min(240px, 70vw)",
              }}
              aria-label="View full image"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={message.imageUrl}
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent px-2 pb-1.5 pt-6">
                <StatusRow
                  message={message}
                  isOwn={isOwn}
                  showStatus={showStatus}
                  className="text-white/90"
                />
              </div>
              {message.status === "sending" && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </button>
            <ImageLightbox
              open={lightboxOpen}
              src={message.imageUrl!}
              onClose={() => setLightboxOpen(false)}
            />
          </>
        ) : isLocation ? (
          <div
            className={cn(
              "overflow-hidden rounded-2xl",
              isOwn
                ? "rounded-br-sm bg-[var(--jobchat-accent)] text-white"
                : "rounded-bl-sm border border-gray-200 bg-white text-gray-900"
            )}
          >
            <a
              href={locationUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "block min-w-[220px] px-3 py-3 active:opacity-90",
                message.status === "sending" && "pointer-events-none opacity-70"
              )}
              aria-label="Open location in maps"
            >
              <div
                className={cn(
                  "mb-2 flex h-24 items-center justify-center rounded-xl",
                  isOwn ? "bg-white/15" : "bg-[var(--jobchat-accent-light)]"
                )}
              >
                <MapPin
                  className={cn(
                    "h-9 w-9",
                    isOwn ? "text-white" : "text-[var(--jobchat-accent)]"
                  )}
                  strokeWidth={1.8}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-semibold">
                  {message.locationLabel || displayText || "📍 מיקום"}
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 opacity-80" />
              </div>
            </a>
            <StatusRow
              message={message}
              isOwn={isOwn}
              showStatus={showStatus}
              className={cn(
                "px-3 pb-2",
                isOwn ? "text-white/70" : "text-gray-400"
              )}
            />
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-3 py-2 text-[15px] leading-snug",
              isOwn
                ? "rounded-br-sm bg-[var(--jobchat-accent)] text-white"
                : "rounded-bl-sm border border-gray-200 bg-white text-gray-900"
            )}
          >
            <p className="whitespace-pre-wrap break-words">{displayText}</p>
            <StatusRow
              message={message}
              isOwn={isOwn}
              showStatus={showStatus}
              className={cn(
                "mt-1",
                isOwn ? "text-white/70" : "text-gray-400"
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
