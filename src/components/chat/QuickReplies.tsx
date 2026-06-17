"use client";

type QuickRepliesProps = {
  replies: string[];
  onSelect: (text: string) => void;
};

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <div className="shrink-0 border-t border-[var(--jobchat-border)] bg-white px-4 py-3">
      <div className="flex flex-wrap justify-center gap-2">
        {replies.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => onSelect(reply)}
            className="rounded-full border border-[var(--jobchat-accent)]/25 bg-[var(--jobchat-accent-light)] px-4 py-2 text-sm font-medium text-[var(--jobchat-accent)] transition-colors hover:bg-[var(--jobchat-accent)]/10 active:bg-[var(--jobchat-accent)]/20"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
