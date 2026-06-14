"use client";

import type { ProcessedMessage } from "@/lib/api/messages";
import { compressImageFile } from "@/lib/images/compress";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import {
  getStoredManagerId,
  setStoredManagerId,
} from "@/lib/manager-session";
import { jobChatPersistStorage } from "@/lib/mock/safe-storage";
import type { TranslationContextMessage } from "@/lib/server/glossary";
import { generateId, normalizePhone } from "@/lib/utils";
import type { ContactAliases, Invite, LanguageCode, Message, Worker } from "@/types";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type SlangState = {
  managerId: string | null;
  managerName: string;
  managerPhone: string;
  companyName: string;
  workers: Worker[];
  messages: Message[];
  invites: Invite[];
  contactAliases: ContactAliases;
  ready: boolean;
  bootstrapManager: () => Promise<void>;
  loadWorkers: () => Promise<void>;
  fetchInvite: (token: string) => Promise<{ worker: Worker; invite: Invite } | null>;
  loadMessages: (workerId: string) => Promise<void>;
  addWorker: (name: string, phone: string) => Promise<Worker>;
  setWorkerLanguage: (workerId: string, language: LanguageCode) => Promise<void>;
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
    result: ProcessedMessage,
    workerLanguage?: LanguageCode,
    context?: TranslationContextMessage[]
  ) => Promise<Message>;
  markManagerMessagesRead: (workerId: string) => Promise<void>;
  markWorkerMessagesRead: (workerId: string) => Promise<void>;
  setContactAlias: (
    viewerRole: "manager" | "worker",
    workerId: string,
    name: string
  ) => void;
  upsertMessage: (message: Message) => void;
  mergeMessages: (messages: Message[]) => void;
  upsertWorker: (worker: Worker) => void;
  upsertInvite: (invite: Invite) => void;
};

function createPendingMessage(
  workerId: string,
  senderRole: "manager" | "worker",
  text: string,
  inputType: "text" | "voice" | "image"
): Message {
  return {
    id: `pending-${generateId()}`,
    workerId,
    senderRole,
    originalText: text,
    originalLang: senderRole === "manager" ? "he" : "en",
    inputType,
    createdAt: new Date().toISOString(),
    status: "sending",
  };
}

function mergeWorkerList(workers: Worker[], worker: Worker): Worker[] {
  const index = workers.findIndex((w) => w.id === worker.id);
  if (index === -1) return [worker, ...workers];
  const next = [...workers];
  next[index] = worker;
  return next;
}

function mergeInviteList(invites: Invite[], invite: Invite): Invite[] {
  const index = invites.findIndex((i) => i.token === invite.token);
  if (index === -1) return [invite, ...invites];
  const next = [...invites];
  next[index] = invite;
  return next;
}

export const useSlangStore = create<SlangState>()(
  persist(
    (set, get) => ({
      managerId: null,
      managerName: "",
      managerPhone: "",
      companyName: "",
      workers: [],
      messages: [],
      invites: [],
      contactAliases: { manager: {}, worker: {} },
      ready: false,

      bootstrapManager: async () => {
        const storedId = getStoredManagerId();
        const res = await fetch("/api/managers/bootstrap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ managerId: storedId }),
        });

        if (!res.ok) throw new Error("Failed to bootstrap manager");

        const data = await res.json();
        setStoredManagerId(data.manager.id);
        set({
          managerId: data.manager.id,
          managerName: data.manager.name,
          managerPhone: data.manager.phone,
          companyName: data.manager.companyName,
          ready: true,
        });

        await get().loadWorkers();
      },

      loadWorkers: async () => {
        const managerId = get().managerId;
        if (!managerId) return;

        const res = await fetch(
          `/api/workers?managerId=${encodeURIComponent(managerId)}`
        );
        if (!res.ok) throw new Error("Failed to load workers");

        const data = await res.json();
        const workers = data.workers as Worker[];
        const invites: Invite[] = workers.map((worker) => ({
          token: worker.inviteToken,
          workerId: worker.id,
          managerName: get().managerName,
          managerPhone: get().managerPhone,
          companyName: get().companyName,
        }));

        set({ workers, invites });
      },

      fetchInvite: async (token) => {
        const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
        if (!res.ok) return null;

        const data = await res.json();
        const worker = data.worker as Worker;
        const invite = data.invite as Invite;

        set((state) => ({
          workers: mergeWorkerList(state.workers, worker),
          invites: mergeInviteList(state.invites, invite),
          managerPhone: invite.managerPhone || state.managerPhone,
          managerName: invite.managerName || state.managerName,
          companyName: invite.companyName || state.companyName,
        }));

        return { worker, invite };
      },

      loadMessages: async (workerId) => {
        const res = await fetch(
          `/api/messages?workerId=${encodeURIComponent(workerId)}`
        );
        if (!res.ok) throw new Error("Failed to load messages");

        const data = await res.json();
        get().mergeMessages(data.messages as Message[]);
      },

      addWorker: async (name, phone) => {
        const managerId = get().managerId;
        if (!managerId) throw new Error("Manager not bootstrapped");

        const res = await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId,
            name: name.trim(),
            phone: normalizePhone(phone),
          }),
        });

        if (!res.ok) throw new Error("Failed to add worker");

        const data = await res.json();
        const worker = data.worker as Worker;
        const invite = data.invite as Invite;

        set((state) => ({
          workers: [worker, ...state.workers],
          invites: [invite, ...state.invites],
        }));

        return worker;
      },

      setWorkerLanguage: async (workerId, language) => {
        const normalized = normalizeWorkerLanguage(language);
        const res = await fetch(`/api/workers/${encodeURIComponent(workerId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: normalized }),
        });

        if (!res.ok) throw new Error("Failed to set language");

        const data = await res.json();
        const worker = data.worker as Worker;
        get().upsertWorker(worker);
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
        set((state) => ({ messages: [...state.messages, pending] }));

        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workerId,
              senderRole,
              text: trimmed,
              workerLanguage,
              context,
              inputType: "text",
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? "Failed to send message");
          }

          const data = await res.json();
          const message = data.message as Message;
          set((state) => ({
            messages: state.messages
              .filter((m) => m.id !== pending.id)
              .concat(message),
          }));
          return message;
        } catch (error) {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === pending.id ? { ...m, status: "failed" as const } : m
            ),
          }));
          throw error instanceof Error
            ? error
            : new Error("Failed to send message");
        }
      },

      sendImageMessage: async (workerId, senderRole, file) => {
        const pending = createPendingMessage(workerId, senderRole, "", "image");
        set((state) => ({ messages: [...state.messages, pending] }));

        try {
          const imageUrl = await compressImageFile(file);
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workerId,
              senderRole,
              inputType: "image",
              imageUrl,
            }),
          });

          if (!res.ok) throw new Error("Failed to send image");

          const data = await res.json();
          const message = data.message as Message;
          set((state) => ({
            messages: state.messages
              .filter((m) => m.id !== pending.id)
              .concat(message),
          }));
          return message;
        } catch {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === pending.id ? { ...m, status: "failed" as const } : m
            ),
          }));
          throw new Error("Failed to send image");
        }
      },

      commitProcessedMessage: async (
        workerId,
        senderRole,
        result,
        workerLanguage,
        context
      ) => {
        const pending = createPendingMessage(
          workerId,
          senderRole,
          result.originalText,
          result.inputType
        );
        set((state) => ({ messages: [...state.messages, pending] }));

        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workerId,
              senderRole,
              workerLanguage,
              context,
              inputType: result.inputType,
              processed: result,
            }),
          });

          if (!res.ok) throw new Error("Failed to send message");

          const data = await res.json();
          const message = data.message as Message;
          set((state) => ({
            messages: state.messages
              .filter((m) => m.id !== pending.id)
              .concat(message),
          }));
          return message;
        } catch (error) {
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === pending.id ? { ...m, status: "failed" as const } : m
            ),
          }));
          throw error instanceof Error
            ? error
            : new Error("Failed to send message");
        }
      },

      markManagerMessagesRead: async (workerId) => {
        const res = await fetch("/api/messages/read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerId, viewerRole: "worker" }),
        });
        if (!res.ok) return;

        const data = await res.json();
        get().mergeMessages(data.messages as Message[]);
      },

      markWorkerMessagesRead: async (workerId) => {
        const res = await fetch("/api/messages/read", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workerId, viewerRole: "manager" }),
        });
        if (!res.ok) return;

        const data = await res.json();
        get().mergeMessages(data.messages as Message[]);
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

      upsertMessage: (message) => {
        set((state) => {
          const index = state.messages.findIndex((m) => m.id === message.id);
          if (index === -1) {
            return { messages: [...state.messages, message] };
          }
          const next = [...state.messages];
          next[index] = message;
          return { messages: next };
        });
      },

      mergeMessages: (incoming) => {
        set((state) => {
          const byId = new Map(state.messages.map((m) => [m.id, m]));
          for (const message of incoming) {
            byId.set(message.id, message);
          }
          return { messages: Array.from(byId.values()) };
        });
      },

      upsertWorker: (worker) => {
        set((state) => ({
          workers: mergeWorkerList(state.workers, worker),
        }));
      },

      upsertInvite: (invite) => {
        set((state) => ({
          invites: mergeInviteList(state.invites, invite),
        }));
      },
    }),
    {
      name: "slang-session",
      storage: jobChatPersistStorage,
      partialize: (state) => ({
        managerId: state.managerId,
        contactAliases: state.contactAliases,
      }),
    }
  )
);

/** @deprecated Use useSlangStore */
export const useJobChatStore = useSlangStore;

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
  return message.originalText;
}

export function useWorkerMessages(workerId: string): Message[] {
  const messages = useSlangStore((s) => s.messages);
  return useMemo(
    () => selectMessagesForWorker(messages, workerId),
    [messages, workerId]
  );
}

export function useWorkerByToken(token: string): Worker | undefined {
  return useSlangStore((s) =>
    s.workers.find((w) => w.inviteToken === token)
  );
}

export function useInviteByToken(token: string): Invite | undefined {
  return useSlangStore((s) => s.invites.find((i) => i.token === token));
}

export function useWorkerById(workerId: string): Worker | undefined {
  return useSlangStore((s) => s.workers.find((w) => w.id === workerId));
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
  const alias = useSlangStore(
    (s) => s.contactAliases?.[viewerRole]?.[workerId]
  );
  return alias?.trim() || defaultName;
}

export function useLastMessage(workerId: string): Message | undefined {
  const messages = useWorkerMessages(workerId);
  return messages[messages.length - 1];
}
