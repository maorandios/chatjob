"use client";

import type { ProcessedMessage } from "@/lib/api/messages";
import { compressImageFile } from "@/lib/images/compress";
import { CONTACT_PAGE_SIZE, MESSAGE_PAGE_SIZE } from "@/lib/constants/limits";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import {
  clearStoredManagerId,
  getStoredManagerId,
  setStoredManagerId,
} from "@/lib/manager-session";
import { jobChatPersistStorage } from "@/lib/mock/safe-storage";
import type { TranslationContextMessage } from "@/lib/server/glossary";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { generateId, normalizePhone } from "@/lib/utils";
import type {
  Company,
  ContactAliasEntry,
  ContactAliasValue,
  ContactAliases,
  ContactRole,
  Invite,
  LanguageCode,
  Manager,
  Message,
  Worker,
  WorkerInvite,
} from "@/types";
import { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

let managerBootstrapPromise: Promise<void> | null = null;

type ContactLoadOptions = {
  append?: boolean;
  limit?: number;
  offset?: number;
  query?: string;
};

type SlangState = {
  managerId: string | null;
  managerName: string;
  managerPhone: string;
  managerInviteToken: string;
  managerProfileImageUrl: string | undefined;
  isAdmin: boolean;
  onboardingComplete: boolean;
  companyId: string;
  companyName: string;
  managers: Manager[];
  managersHasMore: boolean;
  workers: Worker[];
  workersHasMore: boolean;
  messages: Message[];
  invites: Invite[];
  contactAliases: ContactAliases;
  ready: boolean;
  loggedOut: boolean;
  bootstrapError: string | null;
  bootstrapManager: (inviteToken?: string, managerId?: string) => Promise<void>;
  loadWorkers: (options?: ContactLoadOptions) => Promise<void>;
  fetchInvite: (
    token: string
  ) => Promise<{
    worker: Worker;
    invite: WorkerInvite;
    managers: Manager[];
  } | null>;
  loadMessages: (
    managerId: string,
    workerId: string,
    options?: {
      before?: string;
      limit?: number;
      viewerRole?: "manager" | "worker";
    }
  ) => Promise<{ messages: Message[]; hasMore: boolean }>;
  loadMessagePreviews: (options: {
    managerId?: string;
    workerId?: string;
  }) => Promise<void>;
  loadManagersForWorker: (
    workerToken: string,
    options?: ContactLoadOptions
  ) => Promise<void>;
  setConversationMessages: (
    managerId: string,
    workerId: string,
    messages: Message[]
  ) => void;
  addManager: (name: string, phone?: string) => Promise<Manager>;
  addWorker: (
    name: string,
    phone?: string,
    profile?: { privateNote?: string }
  ) => Promise<Worker>;
  removeManager: (managerId: string) => Promise<void>;
  removeWorker: (workerId: string) => Promise<void>;
  deleteManagerAccount: () => Promise<void>;
  deleteWorkerAccount: (workerId: string) => Promise<void>;
  setWorkerLanguage: (workerId: string, language: LanguageCode) => Promise<void>;
  sendMessage: (
    managerId: string,
    workerId: string,
    senderRole: "manager" | "worker",
    text: string,
    workerLanguage?: LanguageCode,
    context?: TranslationContextMessage[]
  ) => Promise<Message>;
  sendImageMessage: (
    managerId: string,
    workerId: string,
    senderRole: "manager" | "worker",
    file: File
  ) => Promise<Message>;
  sendLocationMessage: (
    managerId: string,
    workerId: string,
    senderRole: "manager" | "worker",
    location: {
      latitude: number;
      longitude: number;
      label?: string;
    }
  ) => Promise<Message>;
  commitProcessedMessage: (
    managerId: string,
    workerId: string,
    senderRole: "manager" | "worker",
    result: ProcessedMessage,
    workerLanguage?: LanguageCode,
    context?: TranslationContextMessage[]
  ) => Promise<Message>;
  markManagerMessagesRead: (managerId: string, workerId: string) => Promise<void>;
  markWorkerMessagesRead: (managerId: string, workerId: string) => Promise<void>;
  loadContactAliases: (
    ownerRole: "manager" | "worker",
    ownerId: string
  ) => Promise<void>;
  setContactAlias: (
    viewerRole: "manager" | "worker",
    contactId: string,
    profile: ContactAliasEntry,
    options?: { contactRole?: ContactRole; ownerId?: string }
  ) => Promise<void>;
  updateWorkerProfile: (
    workerId: string,
    profile: {
      name: string;
      phone?: string;
      privateNote?: string;
    }
  ) => Promise<void>;
  updateManagerProfile: (profile: {
    name: string;
    phone: string;
  }) => Promise<void>;
  updateManagerById: (
    targetManagerId: string,
    profile: { name: string; phone: string }
  ) => Promise<void>;
  updateCompanyDetails: (details: { name: string }) => Promise<void>;
  uploadManagerProfileImage: (file: File) => Promise<void>;
  uploadWorkerProfileImage: (workerId: string, file: File) => Promise<void>;
  upsertMessage: (message: Message) => void;
  mergeMessages: (messages: Message[]) => void;
  upsertWorker: (worker: Worker) => void;
  upsertManager: (manager: Manager) => void;
  upsertInvite: (invite: Invite) => void;
  logoutManager: () => void;
  signInManager: (managerId: string) => Promise<void>;
  completeOnboarding: (details: {
    companyName: string;
    fullName: string;
    phone: string;
  }) => Promise<void>;
};

function normalizeContactAliasEntry(
  value: ContactAliasValue | undefined
): ContactAliasEntry {
  if (!value) return {};
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name } : {};
  }
  return {
    name: value.name?.trim() || undefined,
    phone: value.phone?.trim() || undefined,
  };
}

function createPendingMessage(
  companyId: string,
  managerId: string,
  workerId: string,
  senderRole: "manager" | "worker",
  text: string,
  inputType: Message["inputType"],
  extra: Partial<Message> = {}
): Message {
  return {
    id: `pending-${generateId()}`,
    companyId,
    managerId,
    workerId,
    senderRole,
    originalText: text,
    originalLang: senderRole === "manager" ? "he" : "en",
    inputType,
    createdAt: new Date().toISOString(),
    status: "sending",
    ...extra,
  };
}

async function getAuthHeaders(
  headers: HeadersInit = {}
): Promise<HeadersInit> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return headers;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return headers;

  return {
    ...headers,
    Authorization: `Bearer ${session.access_token}`,
  };
}

function mergeWorkerList(workers: Worker[], worker: Worker): Worker[] {
  const index = workers.findIndex((w) => w.id === worker.id);
  if (index === -1) return [worker, ...workers];
  const next = [...workers];
  next[index] = worker;
  return next;
}

function appendWorkerPage(workers: Worker[], page: Worker[]): Worker[] {
  const byId = new Map(workers.map((worker) => [worker.id, worker]));
  const next = [...workers];
  for (const worker of page) {
    if (byId.has(worker.id)) continue;
    byId.set(worker.id, worker);
    next.push(worker);
  }
  return next;
}

function mergeManagerList(managers: Manager[], manager: Manager): Manager[] {
  const index = managers.findIndex((m) => m.id === manager.id);
  if (index === -1) return [manager, ...managers];
  const next = [...managers];
  next[index] = manager;
  return next;
}

function appendManagerPage(managers: Manager[], page: Manager[]): Manager[] {
  const byId = new Map(managers.map((manager) => [manager.id, manager]));
  const next = [...managers];
  for (const manager of page) {
    if (byId.has(manager.id)) continue;
    byId.set(manager.id, manager);
    next.push(manager);
  }
  return next;
}

function mergeInviteList(invites: Invite[], invite: Invite): Invite[] {
  const index = invites.findIndex((i) => i.token === invite.token);
  if (index === -1) return [invite, ...invites];
  const next = [...invites];
  next[index] = invite;
  return next;
}

function mergeContactAlias(
  aliases: ContactAliases,
  viewerRole: "manager" | "worker",
  contactId: string,
  profile: ContactAliasEntry
): ContactAliases {
  const roleAliases = { ...aliases[viewerRole] };
  const existing = normalizeContactAliasEntry(roleAliases[contactId]);
  const next: ContactAliasEntry = { ...existing };

  if (profile.name !== undefined) {
    next.name = profile.name.trim() || undefined;
  }
  if (profile.phone !== undefined) {
    next.phone = profile.phone.trim() || undefined;
  }

  if (!next.name && !next.phone) {
    delete roleAliases[contactId];
  } else {
    roleAliases[contactId] = next;
  }

  return {
    ...aliases,
    [viewerRole]: roleAliases,
  };
}

function resolveCompanyId(
  state: SlangState,
  managerId: string,
  workerId: string
): string {
  return (
    state.managers.find((m) => m.id === managerId)?.companyId ||
    state.workers.find((w) => w.id === workerId)?.companyId ||
    state.companyId ||
    ""
  );
}

export const useSlangStore = create<SlangState>()(
  persist(
    (set, get) => ({
      managerId: null,
      managerName: "",
      managerPhone: "",
      managerInviteToken: "",
      managerProfileImageUrl: undefined,
      isAdmin: false,
      onboardingComplete: true,
      companyId: "",
      companyName: "",
      managers: [],
      managersHasMore: false,
      workers: [],
      workersHasMore: false,
      messages: [],
      invites: [],
      contactAliases: { manager: {}, worker: {} },
      ready: false,
      loggedOut: false,
      bootstrapError: null,

      logoutManager: () => {
        managerBootstrapPromise = null;
        clearStoredManagerId();
        set({
          loggedOut: true,
          ready: true,
          managerId: null,
          managerName: "",
          managerPhone: "",
          managerInviteToken: "",
          managerProfileImageUrl: undefined,
          isAdmin: false,
          onboardingComplete: true,
          companyId: "",
          companyName: "",
          managers: [],
          managersHasMore: false,
          workers: [],
          workersHasMore: false,
          messages: [],
          invites: [],
          bootstrapError: null,
        });
      },

      signInManager: async (managerId) => {
        managerBootstrapPromise = null;
        set({
          loggedOut: false,
          ready: false,
          managerId: null,
          bootstrapError: null,
        });
        setStoredManagerId(managerId);
        await get().bootstrapManager(undefined, managerId);

        const state = get();
        if (state.managerId !== managerId) {
          throw new Error(
            state.bootstrapError ?? "לא ניתן להשלים את ההתחברות. נסו שוב."
          );
        }
      },

      completeOnboarding: async ({ companyName, fullName, phone }) => {
        const managerId = get().managerId;
        if (!managerId) throw new Error("לא נמצאה התחברות פעילה");

        const res = await fetch(
          `/api/managers/${encodeURIComponent(managerId)}/onboarding`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyName, fullName, phone }),
          }
        );

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string"
              ? data.error
              : "לא ניתן ליצור את החשבון"
          );
        }

        const manager = data.manager as Manager;
        const company = data.company as Company;

        set((state) => ({
          managerName: manager.name,
          managerPhone: manager.phone,
          onboardingComplete: true,
          companyId: company.id,
          companyName: company.name,
          managersHasMore: false,
          workersHasMore: false,
          managers: mergeManagerList(state.managers, manager),
        }));
      },

      bootstrapManager: async (inviteToken, explicitManagerId) => {
        if (!inviteToken && get().loggedOut) return;

        if (inviteToken) {
          set({ loggedOut: false });
        }

        if (!inviteToken) {
          if (get().ready && !explicitManagerId) return;
          if (managerBootstrapPromise) return managerBootstrapPromise;
        }

        const run = async () => {
        const applyBootstrap = (data: {
          manager: Manager;
          company: { id: string; name: string };
          managers?: Manager[];
          workers?: Worker[];
        }) => {
          const manager = data.manager;
          const teamManagers = data.managers ?? [];
          const teamWorkers = data.workers ?? [];

          setStoredManagerId(manager.id);
          set({
            managerId: manager.id,
            managerName: manager.name,
            managerPhone: manager.phone,
            managerInviteToken: manager.inviteToken,
            managerProfileImageUrl: manager.profileImageUrl,
            isAdmin: manager.isAdmin,
            onboardingComplete: manager.onboardingComplete,
            loggedOut: false,
            companyId: data.company.id,
            companyName: data.company.name,
            managers: teamManagers,
            managersHasMore: false,
            workers: teamWorkers,
            workersHasMore: false,
            invites: teamWorkers.map((worker) => ({
              token: worker.inviteToken,
              workerId: worker.id,
              companyId: worker.companyId,
              companyName: data.company.name,
            })),
            ready: true,
            bootstrapError: null,
          });
          void get().loadMessagePreviews({ managerId: manager.id });
          void get().loadContactAliases("manager", manager.id);
        };

        async function requestBootstrap(payload: {
          managerId?: string;
          inviteToken?: string;
        }) {
          const res = await fetch("/api/managers/bootstrap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json().catch(() => ({}));
          return { res, data };
        }

        if (inviteToken) {
          const { res, data } = await requestBootstrap({ inviteToken });
          if (!res.ok) {
            const message =
              typeof data.error === "string"
                ? data.error
                : "Failed to bootstrap manager";
            set({ bootstrapError: message, ready: false });
            throw new Error(message);
          }
          applyBootstrap(data);
          return;
        }

        const storedId = explicitManagerId ?? getStoredManagerId();
        if (storedId) {
          const { res, data } = await requestBootstrap({ managerId: storedId });
          if (res.ok) {
            applyBootstrap(data);
            return;
          }
          clearStoredManagerId();
          if (explicitManagerId) {
            const message =
              typeof data.error === "string"
                ? data.error
                : "לא ניתן לטעון את פרטי המשתמש";
            set({ bootstrapError: message, ready: false });
            throw new Error(message);
          }
        }

        const savedInviteToken = get().managerInviteToken;
        if (savedInviteToken) {
          const { res, data } = await requestBootstrap({
            inviteToken: savedInviteToken,
          });
          if (res.ok) {
            applyBootstrap(data);
            return;
          }
        }

        set({ ready: true, managerId: null, bootstrapError: null });
        return;
        };

        if (!inviteToken) {
          managerBootstrapPromise = run().finally(() => {
            managerBootstrapPromise = null;
          });
          return managerBootstrapPromise;
        }

        return run();
      },

      loadWorkers: async (options = {}) => {
        const managerId = get().managerId;
        if (!managerId) return;

        const params = new URLSearchParams({
          managerId,
          limit: String(options.limit ?? CONTACT_PAGE_SIZE),
          offset: String(options.offset ?? 0),
        });
        const query = options.query?.trim();
        if (query) params.set("q", query);

        const res = await fetch(`/api/workers?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load workers");

        const data = await res.json();
        const workers = (data.workers ?? []) as Worker[];
        set((state) => ({
          workers: options.append ? appendWorkerPage(state.workers, workers) : workers,
          workersHasMore: Boolean(data.hasMore),
        }));
      },

      fetchInvite: async (token) => {
        const res = await fetch(`/api/invites/${encodeURIComponent(token)}`, {
          headers: await getAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok && data.code !== "WORKER_AUTH_REQUIRED") return null;

        const worker = data.worker as Worker;
        const invite = data.invite as WorkerInvite;
        const managers = (data.managers ?? []) as Manager[];

        if (!worker || !invite) return null;

        set((state) => ({
          workers: mergeWorkerList(state.workers, worker),
          invites: mergeInviteList(state.invites, invite),
          managers,
          companyId: invite.companyId,
          companyName: invite.companyName,
        }));

        if (data.code === "WORKER_AUTH_REQUIRED") {
          throw Object.assign(new Error("WORKER_AUTH_REQUIRED"), {
            code: "WORKER_AUTH_REQUIRED",
          });
        }

        await get().loadContactAliases("worker", worker.id);
        void get().loadMessagePreviews({ workerId: worker.id });

        return { worker, invite, managers };
      },

      loadMessages: async (managerId, workerId, options) => {
        const limit = options?.limit ?? MESSAGE_PAGE_SIZE;
        const params = new URLSearchParams({
          managerId,
          workerId,
          limit: String(limit),
        });
        if (options?.before) {
          params.set("before", options.before);
        }
        if (options?.viewerRole) {
          params.set("viewerRole", options.viewerRole);
        }

        const res = await fetch(`/api/messages?${params.toString()}`, {
          headers: await getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to load messages");

        const data = await res.json();
        return {
          messages: data.messages as Message[],
          hasMore: Boolean(data.hasMore),
        };
      },

      loadMessagePreviews: async ({ managerId, workerId }) => {
        const params = new URLSearchParams();
        if (managerId) params.set("managerId", managerId);
        if (workerId) params.set("workerId", workerId);

        const res = await fetch(`/api/messages/previews?${params.toString()}`, {
          headers: await getAuthHeaders(),
        });
        if (!res.ok) return;

        const data = await res.json();
        const previews = data.previews as Message[];
        if (previews.length > 0) {
          get().mergeMessages(previews);
        }
      },

      loadManagersForWorker: async (workerToken, options = {}) => {
        if (!workerToken) return;

        const params = new URLSearchParams({
          workerToken,
          limit: String(options.limit ?? CONTACT_PAGE_SIZE),
          offset: String(options.offset ?? 0),
        });
        const query = options.query?.trim();
        if (query) params.set("q", query);

        const res = await fetch(`/api/managers?${params.toString()}`, {
          headers: await getAuthHeaders(),
        });
        if (!res.ok) return;

        const data = await res.json();
        const managers = (data.managers ?? []) as Manager[];
        set((state) => ({
          managers: options.append
            ? appendManagerPage(state.managers, managers)
            : managers,
          managersHasMore: Boolean(data.hasMore),
        }));
      },

      setConversationMessages: (managerId, workerId, messages) => {
        set((state) => {
          const pending = state.messages.filter(
            (m) =>
              m.managerId === managerId &&
              m.workerId === workerId &&
              m.status === "sending"
          );
          const other = state.messages.filter(
            (m) => !(m.managerId === managerId && m.workerId === workerId)
          );
          const byId = new Map<string, Message>();
          for (const message of [...messages, ...pending]) {
            byId.set(message.id, message);
          }
          return { messages: [...other, ...Array.from(byId.values())] };
        });
      },

      addManager: async (name, phone) => {
        const managerId = get().managerId;
        if (!managerId || !get().isAdmin) {
          throw new Error("Only admin manager can add managers");
        }

        const res = await fetch("/api/managers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId,
            name: name.trim(),
            phone: normalizePhone(phone ?? ""),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to add manager");
        }

        const data = await res.json();
        const manager = data.manager as Manager;
        set((state) => ({
          managers: mergeManagerList(state.managers, manager),
        }));
        return manager;
      },

      addWorker: async (name, phone, profile) => {
        const managerId = get().managerId;
        if (!managerId || !get().isAdmin) {
          throw new Error("Only admin manager can add workers");
        }

        const res = await fetch("/api/workers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId,
            name: name.trim(),
            phone: normalizePhone(phone ?? ""),
            privateNote: profile?.privateNote ?? "",
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to add worker");
        }

        const data = await res.json();
        const worker = data.worker as Worker;
        const invite = data.invite as WorkerInvite;

        set((state) => ({
          workers: mergeWorkerList(state.workers, worker),
          invites: mergeInviteList(state.invites, invite),
        }));

        return worker;
      },

      removeManager: async (targetManagerId) => {
        const managerId = get().managerId;
        if (!managerId || !get().isAdmin) {
          throw new Error("Only admin manager can remove managers");
        }

        const res = await fetch(
          `/api/managers/${encodeURIComponent(targetManagerId)}?managerId=${encodeURIComponent(managerId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to remove manager");

        set((state) => ({
          managers: state.managers.filter((m) => m.id !== targetManagerId),
        }));
      },

      removeWorker: async (workerId) => {
        const managerId = get().managerId;
        if (!managerId || !get().isAdmin) {
          throw new Error("Only admin manager can remove workers");
        }

        const res = await fetch(
          `/api/workers/${encodeURIComponent(workerId)}?managerId=${encodeURIComponent(managerId)}`,
          { method: "DELETE" }
        );
        if (!res.ok) throw new Error("Failed to remove worker");

        set((state) => ({
          workers: state.workers.filter((w) => w.id !== workerId),
          invites: state.invites.filter((i) => i.workerId !== workerId),
        }));
      },

      deleteManagerAccount: async () => {
        const managerId = get().managerId;
        if (!managerId) throw new Error("Not authenticated");

        const res = await fetch(
          `/api/managers/${encodeURIComponent(managerId)}?managerId=${encodeURIComponent(managerId)}`,
          {
            method: "DELETE",
            headers: await getAuthHeaders(),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to delete account");
        }

        get().logoutManager();
      },

      deleteWorkerAccount: async (workerId) => {
        const res = await fetch(`/api/workers/${encodeURIComponent(workerId)}`, {
          method: "DELETE",
          headers: await getAuthHeaders(),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to delete account");
        }

        set((state) => ({
          workers: state.workers.filter((worker) => worker.id !== workerId),
          invites: state.invites.filter((invite) => invite.workerId !== workerId),
          managers: [],
          messages: state.messages.filter((message) => message.workerId !== workerId),
          contactAliases: { manager: {}, worker: {} },
        }));
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
        managerId,
        workerId,
        senderRole,
        text,
        workerLanguage,
        context
      ) => {
        const state = get();
        const companyId = resolveCompanyId(state, managerId, workerId);
        const trimmed = text.trim();
        const pending = createPendingMessage(
          companyId,
          managerId,
          workerId,
          senderRole,
          trimmed,
          "text"
        );
        set((s) => ({ messages: [...s.messages, pending] }));

        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: await getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              managerId,
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
          set((s) => ({
            messages: s.messages
              .filter((m) => m.id !== pending.id)
              .concat(message),
          }));
          return message;
        } catch (error) {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === pending.id ? { ...m, status: "failed" as const } : m
            ),
          }));
          throw error instanceof Error
            ? error
            : new Error("Failed to send message");
        }
      },

      sendImageMessage: async (managerId, workerId, senderRole, file) => {
        const state = get();
        const companyId = resolveCompanyId(state, managerId, workerId);
        const pending = createPendingMessage(
          companyId,
          managerId,
          workerId,
          senderRole,
          "",
          "image"
        );
        set((s) => ({ messages: [...s.messages, pending] }));

        try {
          const imageUrl = await compressImageFile(file);
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: await getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              managerId,
              workerId,
              senderRole,
              inputType: "image",
              imageUrl,
            }),
          });

          if (!res.ok) throw new Error("Failed to send image");

          const data = await res.json();
          const message = data.message as Message;
          set((s) => ({
            messages: s.messages
              .filter((m) => m.id !== pending.id)
              .concat(message),
          }));
          return message;
        } catch {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === pending.id ? { ...m, status: "failed" as const } : m
            ),
          }));
          throw new Error("Failed to send image");
        }
      },

      sendLocationMessage: async (
        managerId,
        workerId,
        senderRole,
        location
      ) => {
        const state = get();
        const companyId = resolveCompanyId(state, managerId, workerId);
        const label = location.label?.trim() || "מיקום";
        const pending = createPendingMessage(
          companyId,
          managerId,
          workerId,
          senderRole,
          label,
          "location",
          {
            locationLat: location.latitude,
            locationLng: location.longitude,
            locationLabel: label,
          }
        );
        set((s) => ({ messages: [...s.messages, pending] }));

        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: await getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              managerId,
              workerId,
              senderRole,
              inputType: "location",
              locationLat: location.latitude,
              locationLng: location.longitude,
              locationLabel: label,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            const message =
              typeof data.error === "string"
                ? data.error
                : "Failed to send location";
            throw new Error(message);
          }

          const data = await res.json();
          const message = data.message as Message;
          set((s) => ({
            messages: s.messages
              .filter((m) => m.id !== pending.id)
              .concat(message),
          }));
          return message;
        } catch (error) {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === pending.id ? { ...m, status: "failed" as const } : m
            ),
          }));
          throw error instanceof Error
            ? error
            : new Error("Failed to send location");
        }
      },

      commitProcessedMessage: async (
        managerId,
        workerId,
        senderRole,
        result,
        workerLanguage,
        context
      ) => {
        const state = get();
        const companyId = resolveCompanyId(state, managerId, workerId);
        const pending = createPendingMessage(
          companyId,
          managerId,
          workerId,
          senderRole,
          result.originalText,
          result.inputType
        );
        set((s) => ({ messages: [...s.messages, pending] }));

        try {
          const res = await fetch("/api/messages", {
            method: "POST",
            headers: await getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              managerId,
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
          set((s) => ({
            messages: s.messages
              .filter((m) => m.id !== pending.id)
              .concat(message),
          }));
          return message;
        } catch (error) {
          set((s) => ({
            messages: s.messages.map((m) =>
              m.id === pending.id ? { ...m, status: "failed" as const } : m
            ),
          }));
          throw error instanceof Error
            ? error
            : new Error("Failed to send message");
        }
      },

      markManagerMessagesRead: async (managerId, workerId) => {
        const res = await fetch("/api/messages/read", {
          method: "PATCH",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ managerId, workerId, viewerRole: "worker" }),
        });
        if (!res.ok) return;

        const data = await res.json();
        get().mergeMessages(data.messages as Message[]);
      },

      markWorkerMessagesRead: async (managerId, workerId) => {
        const res = await fetch("/api/messages/read", {
          method: "PATCH",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ managerId, workerId, viewerRole: "manager" }),
        });
        if (!res.ok) return;

        const data = await res.json();
        get().mergeMessages(data.messages as Message[]);
      },

      loadContactAliases: async (ownerRole, ownerId) => {
        const params = new URLSearchParams({ ownerRole, ownerId });
        const res = await fetch(`/api/contact-aliases?${params.toString()}`, {
          headers: await getAuthHeaders(),
        });
        if (!res.ok) return;

        const data = await res.json();
        const aliases = data.aliases as ContactAliases;
        if (!aliases) return;

        set((state) => ({
          contactAliases: {
            manager:
              ownerRole === "manager"
                ? aliases.manager
                : state.contactAliases.manager,
            worker:
              ownerRole === "worker"
                ? aliases.worker
                : state.contactAliases.worker,
          },
        }));
      },

      setContactAlias: async (viewerRole, contactId, profile, options) => {
        const state = get();
        const ownerId =
          options?.ownerId ??
          (viewerRole === "manager"
            ? state.managerId
            : state.workers.find((worker) => worker.id === contactId)?.id ??
              state.workers[0]?.id);

        set((current) => ({
          contactAliases: mergeContactAlias(
            current.contactAliases,
            viewerRole,
            contactId,
            profile
          ),
        }));

        if (!ownerId) return;

        const contactRole =
          options?.contactRole ??
          (viewerRole === "manager" ? "worker" : "manager");
        const res = await fetch("/api/contact-aliases", {
          method: "PUT",
          headers: await getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            ownerRole: viewerRole,
            ownerId,
            contactRole,
            contactId,
            name: profile.name ?? "",
            phone: profile.phone ?? "",
          }),
        });

        if (!res.ok) throw new Error("Failed to save contact alias");
      },

      updateWorkerProfile: async (workerId, profile) => {
        const managerId = get().managerId;
        if (!managerId) throw new Error("Not authenticated");

        const body: {
          managerId: string;
          name: string;
          phone?: string;
          privateNote: string;
        } = {
          managerId,
          name: profile.name,
          privateNote: profile.privateNote ?? "",
        };
        if (profile.phone !== undefined) {
          body.phone = normalizePhone(profile.phone);
        }

        const res = await fetch(`/api/workers/${encodeURIComponent(workerId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error("Failed to update worker");

        const data = await res.json();
        const worker = data.worker as Worker;
        get().upsertWorker(worker);

        set((state) => ({
          contactAliases: mergeContactAlias(
            state.contactAliases,
            "manager",
            workerId,
            { name: profile.name, phone: profile.phone }
          ),
        }));
      },

      updateManagerProfile: async (profile) => {
        const managerId = get().managerId;
        if (!managerId) throw new Error("Not authenticated");

        const res = await fetch(`/api/managers/${encodeURIComponent(managerId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId,
            name: profile.name,
            phone: normalizePhone(profile.phone),
          }),
        });

        if (!res.ok) throw new Error("Failed to update profile");

        const data = await res.json();
        const manager = data.manager as Manager;

        set((state) => ({
          managerName: manager.name,
          managerPhone: manager.phone,
          managers: mergeManagerList(state.managers, manager),
        }));
      },

      updateManagerById: async (targetManagerId, profile) => {
        const managerId = get().managerId;
        if (!managerId) throw new Error("Not authenticated");

        const res = await fetch(
          `/api/managers/${encodeURIComponent(targetManagerId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              managerId,
              name: profile.name,
              phone: normalizePhone(profile.phone),
            }),
          }
        );

        if (!res.ok) throw new Error("Failed to update manager");

        const data = await res.json();
        const manager = data.manager as Manager;

        set((state) => ({
          ...(manager.id === state.managerId
            ? { managerName: manager.name, managerPhone: manager.phone }
            : {}),
          managers: mergeManagerList(state.managers, manager),
        }));
      },

      updateCompanyDetails: async (details) => {
        const managerId = get().managerId;
        const companyId = get().companyId;
        if (!managerId || !companyId) throw new Error("Not authenticated");

        const res = await fetch(`/api/companies/${encodeURIComponent(companyId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            managerId,
            name: details.name,
          }),
        });

        if (!res.ok) throw new Error("Failed to update company");

        const data = await res.json();
        const company = data.company as Company;

        set((state) => ({
          companyName: company.name,
          invites: state.invites.map((invite) =>
            invite.companyId === companyId
              ? { ...invite, companyName: company.name }
              : invite
          ),
        }));
      },

      uploadManagerProfileImage: async (file) => {
        const managerId = get().managerId;
        if (!managerId) throw new Error("Not authenticated");

        const imageDataUrl = await compressImageFile(file);
        const res = await fetch(
          `/api/managers/${encodeURIComponent(managerId)}/profile-image`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ managerId, imageDataUrl }),
          }
        );

        if (!res.ok) throw new Error("Failed to upload profile image");

        const data = await res.json();
        const manager = data.manager as Manager;
        const profileImageUrl =
          (data.profileImageUrl as string | undefined) ??
          manager.profileImageUrl;

        set((state) => ({
          managerProfileImageUrl: profileImageUrl,
          managers: mergeManagerList(state.managers, manager),
        }));
      },

      uploadWorkerProfileImage: async (workerId, file) => {
        const imageDataUrl = await compressImageFile(file);
        const res = await fetch(
          `/api/workers/${encodeURIComponent(workerId)}/profile-image`,
          {
            method: "POST",
            headers: await getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ imageDataUrl }),
          }
        );

        if (!res.ok) throw new Error("Failed to upload profile image");

        const data = await res.json();
        const worker = data.worker as Worker;

        set((state) => ({
          workers: mergeWorkerList(state.workers, worker),
        }));
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

      upsertManager: (manager) => {
        set((state) => ({
          managers: mergeManagerList(state.managers, manager),
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
        managerInviteToken: state.managerInviteToken,
        contactAliases: state.contactAliases,
      }),
    }
  )
);

/** @deprecated Use useSlangStore */
export const useJobChatStore = useSlangStore;

export function selectMessagesForConversation(
  messages: Message[],
  managerId: string,
  workerId: string
): Message[] {
  const byId = new Map<string, Message>();
  for (const message of messages) {
    if (message.managerId !== managerId || message.workerId !== workerId) continue;
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/** @deprecated Use selectMessagesForConversation */
export function selectMessagesForWorker(
  messages: Message[],
  workerId: string
): Message[] {
  const byId = new Map<string, Message>();
  for (const message of messages) {
    if (message.workerId !== workerId) continue;
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
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
    return getMediaPreviewText("image", viewerRole, workerLanguage);
  }
  if (message.inputType === "location") {
    return getMediaPreviewText("location", viewerRole, workerLanguage);
  }
  if (message.senderRole === viewerRole) {
    return message.originalText;
  }
  if (message.translatedText) {
    if (
      viewerRole === "worker" &&
      workerLanguage &&
      message.targetLang &&
      message.targetLang.toLowerCase().split("-")[0] !==
        workerLanguage.toLowerCase().split("-")[0]
    ) {
      return message.originalText;
    }
    return message.translatedText;
  }
  return message.originalText;
}

const mediaPreviewText: Record<
  LanguageCode | "he",
  { image: string; location: string }
> = {
  he: { image: "תמונה", location: "מיקום" },
  en: { image: "Image", location: "Location" },
  th: { image: "รูปภาพ", location: "ตำแหน่ง" },
  hi: { image: "फ़ोटो", location: "लोकेशन" },
  si: { image: "ඡායාරූපය", location: "ස්ථානය" },
  ro: { image: "Imagine", location: "Locație" },
  uz: { image: "Rasm", location: "Joylashuv" },
  vi: { image: "Ảnh", location: "Vị trí" },
  az: { image: "Şəkil", location: "Məkan" },
  ar: { image: "صورة", location: "موقع" },
  ru: { image: "Фото", location: "Геолокация" },
  zh: { image: "图片", location: "位置" },
};

function getMediaPreviewText(
  inputType: "image" | "location",
  viewerRole: "manager" | "worker",
  workerLanguage?: LanguageCode
): string {
  const language = viewerRole === "worker" ? (workerLanguage ?? "en") : "he";
  return mediaPreviewText[language][inputType];
}

export function getMessagePreviewIcon(
  message?: Message
): "image" | "location" | null {
  if (message?.inputType === "image") return "image";
  if (message?.inputType === "location") return "location";
  return null;
}

export function useConversationMessages(
  managerId: string,
  workerId: string
): Message[] {
  const messages = useSlangStore((s) => s.messages);
  return useMemo(
    () => selectMessagesForConversation(messages, managerId, workerId),
    [messages, managerId, workerId]
  );
}

/** @deprecated Use useConversationMessages */
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

export function useManagerById(managerId: string): Manager | undefined {
  return useSlangStore((s) => s.managers.find((m) => m.id === managerId));
}

export function getContactDisplayName(
  contactAliases: ContactAliases,
  viewerRole: "manager" | "worker",
  contactId: string,
  defaultName: string
): string {
  const alias = normalizeContactAliasEntry(
    contactAliases?.[viewerRole]?.[contactId]
  ).name;
  return alias || defaultName;
}

export function getContactDisplayPhone(
  contactAliases: ContactAliases,
  viewerRole: "manager" | "worker",
  contactId: string,
  defaultPhone: string
): string {
  const alias = normalizeContactAliasEntry(
    contactAliases?.[viewerRole]?.[contactId]
  ).phone;
  return alias || defaultPhone;
}

export function useContactDisplayName(
  viewerRole: "manager" | "worker",
  contactId: string,
  defaultName: string
): string {
  const alias = useSlangStore((s) =>
    normalizeContactAliasEntry(s.contactAliases?.[viewerRole]?.[contactId]).name
  );
  return alias || defaultName;
}

export function useContactDisplayPhone(
  viewerRole: "manager" | "worker",
  contactId: string,
  defaultPhone: string
): string {
  const alias = useSlangStore((s) =>
    normalizeContactAliasEntry(s.contactAliases?.[viewerRole]?.[contactId]).phone
  );
  return alias || defaultPhone;
}

export function useLastMessage(
  managerId: string,
  workerId: string
): Message | undefined {
  const messages = useConversationMessages(managerId, workerId);
  return messages[messages.length - 1];
}

export function useHasUnreadMessages(
  managerId: string,
  workerId: string,
  viewerRole: "manager" | "worker"
): boolean {
  const messages = useConversationMessages(managerId, workerId);
  return messages.some(
    (message) =>
      message.senderRole !== viewerRole && message.status === "sent"
  );
}
