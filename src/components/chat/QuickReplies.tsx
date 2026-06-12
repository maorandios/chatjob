"use client";

type QuickRepliesProps = {
  replies: string[];
  onSelect: (text: string) => void;
};

export function QuickReplies({ replies, onSelect }: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 px-4 py-3">
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          onClick={() => onSelect(reply)}
          className="rounded-full border border-[#25D366]/40 bg-white px-4 py-2.5 text-sm font-medium text-[#075E54] shadow-sm transition-colors hover:bg-[#25D366]/10 active:bg-[#25D366]/20"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
