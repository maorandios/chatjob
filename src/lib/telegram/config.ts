export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  }
  return token;
}

export function getAppPublicUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }

  return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
}

export function getTelegramMiniAppUrl(path = "/telegram"): string {
  return `${getAppPublicUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getTelegramSetupSecret(): string | undefined {
  return process.env.TELEGRAM_SETUP_SECRET?.trim() || undefined;
}

export function parseTelegramStartParam(
  startParam: string | undefined
): { kind: "worker"; token: string } | { kind: "manager"; token: string } | null {
  if (!startParam) return null;

  if (startParam.startsWith("worker_")) {
    const token = startParam.slice("worker_".length);
    return token ? { kind: "worker", token } : null;
  }

  if (startParam.startsWith("mgr_")) {
    const token = startParam.slice("mgr_".length);
    return token ? { kind: "manager", token } : null;
  }

  return null;
}

export function buildWorkerDeepLink(botUsername: string, inviteToken: string): string {
  return `https://t.me/${botUsername}?start=worker_${inviteToken}`;
}

export function buildManagerDeepLink(botUsername: string, inviteToken: string): string {
  return `https://t.me/${botUsername}?start=mgr_${inviteToken}`;
}
