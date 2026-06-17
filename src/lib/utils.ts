import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatListTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return formatTime(iso);
  }
  return date.toLocaleDateString("he-IL", {
    day: "numeric",
    month: "numeric",
  });
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateToken(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function isValidIsraeliPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 9 && digits.length <= 10;
}

export function getInviteUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/invite/${token}`;
  }
  return `https://chatjob.vercel.app/invite/${token}`;
}

export function getManagerJoinUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/manager/join/${token}`;
  }
  return `https://chatjob.vercel.app/manager/join/${token}`;
}

const TELEGRAM_BOT_USERNAME =
  process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() || "KlingBot";

export function getTelegramWorkerInviteUrl(token: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=worker_${token}`;
}

export function getTelegramManagerInviteUrl(token: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=mgr_${token}`;
}
