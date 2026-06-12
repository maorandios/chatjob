export const LANGUAGE_CODES = [
  "th",
  "zh",
  "hi",
  "fil",
  "en",
  "ar",
  "ru",
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

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

export type MessageInputType = "text" | "voice";

export type Message = {
  id: string;
  workerId: string;
  senderRole: "manager" | "worker";
  originalText: string;
  originalLang: string;
  translatedText?: string;
  targetLang?: string;
  inputType?: MessageInputType;
  createdAt: string;
  status: MessageStatus;
};

export type Invite = {
  token: string;
  workerId: string;
  managerName: string;
  companyName: string;
};

export type LanguageOption = {
  code: LanguageCode;
  nativeName: string;
  flag: string;
  dir: "ltr" | "rtl";
};
