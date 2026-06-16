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

export type ContactAliasEntry = {
  name?: string;
  phone?: string;
};

/** @deprecated Legacy persisted shape — string meant name-only alias */
export type ContactAliasValue = ContactAliasEntry | string;

export type ContactAliases = {
  /** Manager viewing a worker — keyed by worker id */
  manager: Record<string, ContactAliasValue>;
  /** Worker viewing a manager — keyed by manager id */
  worker: Record<string, ContactAliasValue>;
};

export type WorkerStatus = "pending" | "active";

export type Company = {
  id: string;
  name: string;
  email?: string;
  companyNumber?: string;
};

export type Manager = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  email?: string;
  inviteToken: string;
  isAdmin: boolean;
  onboardingComplete: boolean;
  profileImageUrl?: string;
};

export type Worker = {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  employeeNumber?: string;
  address?: string;
  language?: LanguageCode;
  status: WorkerStatus;
  inviteToken: string;
};

export type MessageStatus = "sending" | "sent" | "delivered" | "failed";

export type MessageInputType = "text" | "voice" | "image";

export type Message = {
  id: string;
  companyId: string;
  managerId: string;
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

export type WorkerInvite = {
  token: string;
  workerId: string;
  companyId: string;
  companyName: string;
};

export type LanguageOption = {
  code: LanguageCode;
  nativeName: string;
  countryName: string;
  flag: string;
  dir: "ltr" | "rtl";
};

export type TeamMemberRole = "management" | "worker";

/** @deprecated Use WorkerInvite */
export type Invite = WorkerInvite & {
  managerName?: string;
  managerPhone?: string;
};
