import { createHmac, timingSafeEqual } from "crypto";
import { getTelegramBotToken } from "@/lib/telegram/config";

export type TelegramWebAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
};

export type ParsedTelegramInitData = {
  user: TelegramWebAppUser;
  startParam?: string;
  authDate: number;
  queryId?: string;
  hash: string;
};

function buildDataCheckString(initData: URLSearchParams): string {
  const pairs = [...initData.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b));

  return pairs.map(([key, value]) => `${key}=${value}`).join("\n");
}

export function verifyTelegramInitData(initDataRaw: string): ParsedTelegramInitData {
  const initData = new URLSearchParams(initDataRaw);
  const hash = initData.get("hash");

  if (!hash) {
    throw new Error("Missing Telegram initData hash");
  }

  const dataCheckString = buildDataCheckString(initData);
  const secretKey = createHmac("sha256", "WebAppData")
    .update(getTelegramBotToken())
    .digest();
  const calculatedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const hashBuffer = Buffer.from(hash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");

  if (
    hashBuffer.length !== calculatedBuffer.length ||
    !timingSafeEqual(hashBuffer, calculatedBuffer)
  ) {
    throw new Error("Invalid Telegram initData signature");
  }

  const authDate = Number(initData.get("auth_date") ?? "0");
  if (!authDate) {
    throw new Error("Missing Telegram auth_date");
  }

  const maxAgeSeconds = 60 * 60 * 24;
  if (Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) {
    throw new Error("Telegram initData expired");
  }

  const userRaw = initData.get("user");
  if (!userRaw) {
    throw new Error("Missing Telegram user");
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    throw new Error("Invalid Telegram user payload");
  }

  if (!user?.id) {
    throw new Error("Invalid Telegram user id");
  }

  return {
    user,
    startParam: initData.get("start_param") ?? undefined,
    authDate,
    queryId: initData.get("query_id") ?? undefined,
    hash,
  };
}
