export const LANGUAGE_CODES = [
  "th",
  "ru",
  "en",
  "hi",
  "si",
  "ro",
  "ar",
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export type ContactAliases = {
  manager: Record<string, string>;
  worker: Record<string, string>;
};

export type WorkerStatus = "pending" | "active";

export type Worker = {
  id: string;
  name: string;
  phone: string;
  language?: LanguageCode;
  status: WorkerStatus;
  inviteToken: string;
};

export type MessageStatus = "sending" | "sent" | "delivered" | "failed";

export type MessageInputType = "text" | "voice" | "image";

export type Message = {
  id: string;
  workerId: string;
  senderRole: "manager" | "worker";
  originalText: string;
  originalLang: string;
  translatedText?: string;
  targetLang?: string;
  inputType?: MessageInputType;
  imageUrl?: string;
  createdAt: string;
  status: MessageStatus;
};

export type Invite = {
  token: string;
  workerId: string;
  managerName: string;
  managerPhone: string;
  companyName: string;
};

export type LanguageOption = {
  code: LanguageCode;
  nativeName: string;
  countryName: string;
  flag: string;
  dir: "ltr" | "rtl";
};
