"use client";

import {
  sendTextMessage,
  type ProcessedMessage,
} from "@/lib/api/messages";
import { compressImageFile } from "@/lib/images/compress";
import type { TranslationContextMessage } from "@/lib/server/glossary";
import { mockTranslate } from "@/lib/mock/translations";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import {
  createSeedData,
  DEFAULT_COMPANY_NAME,
  DEFAULT_MANAGER_NAME,
  DEFAULT_MANAGER_PHONE,
} from "@/lib/mock/seed";
import { generateId, generateToken, normalizePhone } from "@/lib/utils";
import type { ContactAliases, Invite, LanguageCode, Message, Worker } from "@/types";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type JobChatState = {
  workers: Worker[];
  messages: Message[];
  invites: Invite[];
  managerName: string;
  managerPhone: string;
  companyName: string;
  contactAliases: ContactAliases;
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
  sendImageMessage: (
    workerId: string,
    senderRole: "manager" | "worker",
    file: File
  ) => Promise<Message>;
  commitProcessedMessage: (
    workerId: string,
    senderRole: "manager" | "worker",
    result: ProcessedMessage
  ) => Message;
  markManagerMessagesRead: (workerId: string) => void;
  markWorkerMessagesRead: (workerId: string) => void;
  setContactAlias: (
    viewerRole: "manager" | "worker",
    workerId: string,
    name: string
  ) => void;
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
    managerPhone: DEFAULT_MANAGER_PHONE,
    companyName: DEFAULT_COMPANY_NAME,
    contactAliases: { manager: {}, worker: {} },
    hydrated: false,
  };
}

function createPendingMessage(
  workerId: string,
  senderRole: "manager" | "worker",
  text: string,
  inputType: "text" | "voice" | "image"
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
          managerPhone: get().managerPhone,
          companyName: get().companyName,
        };
        set((state) => ({
          workers: [worker, ...state.workers],
          invites: [invite, ...state.invites],
        }));
        return worker;
      },

      setWorkerLanguage: (workerId, language) => {
        const normalized = normalizeWorkerLanguage(language);
        set((state) => ({
          workers: state.workers.map((w) =>
            w.id === workerId
              ? { ...w, language: normalized, status: "active" as const }
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
            status: "sent",
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

      sendImageMessage: async (workerId, senderRole, file) => {
        const pending = createPendingMessage(workerId, senderRole, "", "image");
        set((state) => ({
          messages: [...state.messages, pending],
        }));

        try {
          const imageUrl = await compressImageFile(file);
          const updated: Message = {
            ...pending,
            imageUrl,
            status: "sent",
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
          throw new Error("Failed to send image");
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
          status: "sent",
        };
        set((state) => ({
          messages: [...state.messages, message],
        }));
        return message;
      },

      markManagerMessagesRead: (workerId) => {
        set((state) => {
          let changed = false;
          const messages = state.messages.map((m) => {
            if (
              m.workerId === workerId &&
              m.senderRole === "manager" &&
              m.status === "sent"
            ) {
              changed = true;
              return { ...m, status: "delivered" as const };
            }
            return m;
          });
          if (!changed) return state;
          return { messages };
        });
      },

      markWorkerMessagesRead: (workerId) => {
        set((state) => {
          let changed = false;
          const messages = state.messages.map((m) => {
            if (
              m.workerId === workerId &&
              m.senderRole === "worker" &&
              m.status === "sent"
            ) {
              changed = true;
              return { ...m, status: "delivered" as const };
            }
            return m;
          });
          if (!changed) return state;
          return { messages };
        });
      },

      setContactAlias: (viewerRole, workerId, name) => {
        const trimmed = name.trim();
        set((state) => {
          const roleAliases = { ...state.contactAliases[viewerRole] };
          if (trimmed) {
            roleAliases[workerId] = trimmed;
          } else {
            delete roleAliases[workerId];
          }
          return {
            contactAliases: {
              ...state.contactAliases,
              [viewerRole]: roleAliases,
            },
          };
        });
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
      partialize: (state) => ({
        workers: state.workers,
        messages: state.messages,
        invites: state.invites,
        managerName: state.managerName,
        managerPhone: state.managerPhone,
        companyName: state.companyName,
        contactAliases: state.contactAliases,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<JobChatState> | undefined;
        if (!persisted) return currentState;

        return {
          ...currentState,
          ...persisted,
          managerPhone:
            persisted.managerPhone ?? currentState.managerPhone,
          contactAliases: persisted.contactAliases ?? {
            manager: {},
            worker: {},
          },
          invites: (persisted.invites ?? currentState.invites).map(
            (invite) => ({
              ...invite,
              managerPhone:
                invite.managerPhone ??
                persisted.managerPhone ??
                currentState.managerPhone,
            })
          ),
          hydrated: false,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("[JobChat] Failed to load saved data", error);
          try {
            localStorage.removeItem("jobchat-prototype");
          } catch {
            // localStorage may be unavailable in strict private mode
          }
        }
        (state ?? useJobChatStore.getState()).setHydrated(true);
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
  if (message.inputType === "image") {
    return "📷 תמונה";
  }
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

export function getContactDisplayName(
  contactAliases: ContactAliases,
  viewerRole: "manager" | "worker",
  workerId: string,
  defaultName: string
): string {
  const alias = contactAliases?.[viewerRole]?.[workerId]?.trim();
  return alias || defaultName;
}

export function useContactDisplayName(
  viewerRole: "manager" | "worker",
  workerId: string,
  defaultName: string
): string {
  const alias = useJobChatStore(
    (s) => s.contactAliases?.[viewerRole]?.[workerId]
  );
  return alias?.trim() || defaultName;
}

export function useLastMessage(workerId: string): Message | undefined {
  const messages = useWorkerMessages(workerId);
  return messages[messages.length - 1];
}
