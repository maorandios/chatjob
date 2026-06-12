import type { TranslationContextMessage } from "@/lib/server/glossary";
import type { Message } from "@/types";

export function buildTranslationContext(
  messages: Message[],
  limit = 5
): TranslationContextMessage[] {
  return messages.slice(-limit).map((message) => ({
    role: message.senderRole,
    text: message.originalText,
  }));
}
