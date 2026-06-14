const MANAGER_ID_KEY = "slang-manager-id";

export function getStoredManagerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(MANAGER_ID_KEY);
  } catch {
    return null;
  }
}

export function setStoredManagerId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MANAGER_ID_KEY, id);
  } catch {
    // localStorage may be unavailable in strict private mode
  }
}

export function clearStoredManagerId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(MANAGER_ID_KEY);
  } catch {
    // ignore
  }
}
