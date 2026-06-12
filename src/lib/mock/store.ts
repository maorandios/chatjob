"use client";

import {
  sendTextMessage,
  type ProcessedMessage,
} from "@/lib/api/messages";
import type { TranslationContextMessage } from "@/lib/server/glossary";
import { mockTranslate } from "@/lib/mock/translations";
import {
  createSeedData,
  DEFAULT_COMPANY_NAME,
  DEFAULT_MANAGER_NAME,
} from "@/lib/mock/seed";
import { generateId, generateToken, normalizePhone } from "@/lib/utils";
import type { Invite, LanguageCode, Message, Worker } from "@/types";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type JobChatState = {
  workers: Worker[];
  messages: Message[];
  invites: Invite[];
  managerName: string;
  companyName: string;
  hydrated: boolean;
  addWorker: (name: string, phone: string) => Worker;
  setWorkerLanguage: (workerId: string, language: LanguageCode) => void;
  sendMessage: (
    workerId: string,
    senderRole: "manager" | "worker",
    text: string,
    workerLanguage?: LanguageCode,
    context?: TranslationContextMessage[]
  ) => Promise<Message>;
  commitProcessedMessage: (
    workerId: string,
    senderRole: "manager" | "worker",
    result: ProcessedMessage
  ) => Message;
  markMessageDelivered: (messageId: string) => void;
  getWorkerByToken: (token: string) => Worker | undefined;
  getInviteByToken: (token: string) => Invite | undefined;
  getMessagesForWorker: (workerId: string) => Message[];
  getLastMessage: (workerId: string) => Message | undefined;
  reset: () => void;
  setHydrated: (value: boolean) => void;
};

function seedState() {
  const seed = createSeedData();
  return {
    workers: seed.workers,
    messages: seed.messages,
    invites: seed.invites,
    managerName: DEFAULT_MANAGER_NAME,
    companyName: DEFAULT_COMPANY_NAME,
    hydrated: false,
  };
}

function createPendingMessage(
  workerId: string,
  senderRole: "manager" | "worker",
  text: string,
  inputType: "text" | "voice"
): Message {
  return {
    id: generateId(),
    workerId,
    senderRole,
    originalText: text,
    originalLang: senderRole === "manager" ? "he" : "en",
    inputType,
    createdAt: new Date().toISOString(),
    status: "sending",
  };
}

export const useJobChatStore = create<JobChatState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      setHydrated: (value) => set({ hydrated: value }),

      addWorker: (name, phone) => {
        const token = generateToken();
        const worker: Worker = {
          id: generateId(),
          name: name.trim(),
          phone: normalizePhone(phone),
          status: "pending",
          inviteToken: token,
        };
        const invite: Invite = {
          token,
          workerId: worker.id,
          managerName: get().managerName,
          companyName: get().companyName,
        };
        set((state) => ({
          workers: [worker, ...state.workers],
          invites: [invite, ...state.invites],
        }));
        return worker;
      },

      setWorkerLanguage: (workerId, language) => {
        set((state) => ({
          workers: state.workers.map((w) =>
            w.id === workerId
              ? { ...w, language, status: "active" as const }
              : w
          ),
        }));
      },

      sendMessage: async (
        workerId,
        senderRole,
        text,
        workerLanguage,
        context
      ) => {
        const trimmed = text.trim();
        const pending = createPendingMessage(
          workerId,
          senderRole,
          trimmed,
          "text"
        );
        set((state) => ({
          messages: [...state.messages, pending],
        }));

        try {
          const result = await sendTextMessage(
            trimmed,
            senderRole,
            workerLanguage,
            { context }
          );
          const updated: Message = {
            ...pending,
            originalText: result.originalText,
            originalLang: result.originalLang,
            translatedText: result.translatedText,
            targetLang: result.targetLang,
            inputType: result.inputType,
            status: "delivered",
          };
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === pending.id ? updated : m
            ),
          }));
          return updated;
        } catch {
          const failed = { ...pending, status: "failed" as const };
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === pending.id ? failed : m
            ),
          }));
          throw new Error("Failed to send message");
        }
      },

      commitProcessedMessage: (workerId, senderRole, result) => {
        const message: Message = {
          id: generateId(),
          workerId,
          senderRole,
          originalText: result.originalText,
          originalLang: result.originalLang,
          translatedText: result.translatedText,
          targetLang: result.targetLang,
          inputType: result.inputType,
          createdAt: new Date().toISOString(),
          status: "delivered",
        };
        set((state) => ({
          messages: [...state.messages, message],
        }));
        return message;
      },

      markMessageDelivered: (messageId) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, status: "delivered" } : m
          ),
        }));
      },

      getWorkerByToken: (token) =>
        get().workers.find((w) => w.inviteToken === token),

      getInviteByToken: (token) =>
        get().invites.find((i) => i.token === token),

      getMessagesForWorker: (workerId) =>
        get()
          .messages.filter((m) => m.workerId === workerId)
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          ),

      getLastMessage: (workerId) => {
        const msgs = get().getMessagesForWorker(workerId);
        return msgs[msgs.length - 1];
      },

      reset: () => set(seedState()),
    }),
    {
      name: "jobchat-prototype",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export function selectMessagesForWorker(
  messages: Message[],
  workerId: string
): Message[] {
  return messages
    .filter((m) => m.workerId === workerId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getMessageDisplayText(
  message: Message,
  viewerRole: "manager" | "worker",
  workerLanguage?: LanguageCode
): string {
  if (message.senderRole === viewerRole) {
    return message.originalText;
  }
  if (message.translatedText) {
    return message.translatedText;
  }
  const targetLang =
    viewerRole === "manager" ? "he" : (workerLanguage ?? "en");
  return mockTranslate(message.originalText, message.originalLang, targetLang);
}

export function useWorkerMessages(workerId: string): Message[] {
  const messages = useJobChatStore((s) => s.messages);
  return useMemo(
    () => selectMessagesForWorker(messages, workerId),
    [messages, workerId]
  );
}

export function useWorkerByToken(token: string): Worker | undefined {
  return useJobChatStore((s) =>
    s.workers.find((w) => w.inviteToken === token)
  );
}

export function useInviteByToken(token: string): Invite | undefined {
  return useJobChatStore((s) => s.invites.find((i) => i.token === token));
}

export function useWorkerById(workerId: string): Worker | undefined {
  return useJobChatStore((s) => s.workers.find((w) => w.id === workerId));
}

export function useLastMessage(workerId: string): Message | undefined {
  const messages = useWorkerMessages(workerId);
  return messages[messages.length - 1];
}
