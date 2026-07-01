const WORKER_INVITE_TOKEN_KEY = "slang-worker-invite-token";

export function getStoredWorkerInviteToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(WORKER_INVITE_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredWorkerInviteToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(WORKER_INVITE_TOKEN_KEY, token);
  } catch {
    // localStorage may be unavailable in strict private mode
  }
}

export function clearStoredWorkerInviteToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(WORKER_INVITE_TOKEN_KEY);
  } catch {
    // ignore
  }
}
