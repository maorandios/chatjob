"use client";

import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { KeyRound, Loader2 } from "lucide-react";
import { AppListHeader } from "@/components/settings/AppListHeader";
import { AuthBrandLogo } from "@/components/manager/AuthBrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AppLoadingState } from "@/components/ui/AppLoadingState";
import { MobileFrame } from "@/components/ui/MobileFrame";
import { LanguagePicker } from "@/components/worker/LanguagePicker";
import { ManagerChatListItem } from "@/components/worker/ManagerChatListItem";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { verifyEmailOtp } from "@/lib/auth/manager-auth";
import { EMAIL_OTP_LENGTH, isCompleteOtpCode } from "@/lib/auth/otp";
import { sendManagerLoginOtp } from "@/lib/auth/send-manager-otp";
import {
  acceptWorkerInviteByToken,
  validateWorkerInviteEmailForJoin,
} from "@/lib/auth/worker-auth";
import { useInviteBootstrap, useWorkerInboxPreviews } from "@/lib/hooks/use-slang-data";
import { getLanguageDir } from "@/lib/i18n/languages";
import { formatWorkerUi, getWorkerUi } from "@/lib/i18n/worker-ui";
import { useClientSearchParam } from "@/lib/mock/use-client-search-param";
import { useSlangStore } from "@/lib/store";
import { getWorkerJoinPath, getWorkerSettingsPath } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { isWorkerJoined } from "@/lib/workers/invite-status";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  if (!token) return null;

  return <InvitePageContent token={token} />;
}

function WorkerHome({
  token,
  workerId,
  companyName,
  language,
}: {
  token: string;
  workerId: string;
  companyName: string;
  language: LanguageCode;
}) {
  const managers = useSlangStore((s) => s.managers);
  const messages = useSlangStore((s) => s.messages);
  const ui = getWorkerUi(language);
  const dir = getLanguageDir(language);
  const sortedManagers = useMemo(() => {
    const latestByManager = new Map<string, number>();
    for (const message of messages) {
      if (message.workerId !== workerId) continue;
      const current = latestByManager.get(message.managerId) ?? 0;
      const next = new Date(message.createdAt).getTime();
      if (next > current) latestByManager.set(message.managerId, next);
    }

    return [...managers].sort(
      (a, b) =>
        (latestByManager.get(b.id) ?? 0) - (latestByManager.get(a.id) ?? 0)
    );
  }, [managers, messages, workerId]);

  useWorkerInboxPreviews(workerId);

  return (
    <MobileFrame dir={dir}>
      <AppListHeader settingsHref={getWorkerSettingsPath(token)} />

      <div className="chat-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[var(--jobchat-surface)] px-3 py-3">
        {sortedManagers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <p className="text-sm text-gray-500">{companyName}</p>
            <p className="mt-2 text-base font-medium text-gray-900">
              אין מנהלים זמינים עדיין
            </p>
          </div>
        ) : (
          sortedManagers.map((manager) => (
            <ManagerChatListItem
              key={manager.id}
              inviteToken={token}
              workerId={workerId}
              manager={manager}
              workerLanguage={language}
              emptyPreview={ui.noMessagesYet}
            />
          ))
        )}
      </div>
    </MobileFrame>
  );
}

function InviteOnboarding({
  token,
  worker,
}: {
  token: string;
  worker: { id: string; language?: LanguageCode; email?: string };
}) {
  const router = useRouter();
  const isChangingLanguage = useClientSearchParam("changeLang");
  const setWorkerLanguage = useSlangStore((s) => s.setWorkerLanguage);

  const [stage, setStage] = useState<"language" | "email" | "otp">(
    !isChangingLanguage && worker.language ? "email" : "language"
  );
  const [selectedLang, setSelectedLang] = useState<LanguageCode | undefined>(
    worker.language
  );
  const [email, setEmail] = useState(worker.email ?? "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const lastOtpAttemptRef = useRef("");
  const verifyInFlightRef = useRef(false);

  const previewLang = selectedLang ?? worker.language ?? "en";
  const ui = getWorkerUi(previewLang);
  const dir = getLanguageDir(previewLang);
  const continueDisabled =
    stage === "language"
      ? !selectedLang || isSaving
      : stage === "email"
        ? sendingOtp
        : verifyingOtp || !isCompleteOtpCode(otp);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const handleLanguageContinue = async () => {
    if (!selectedLang || isChangingLanguage) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await setWorkerLanguage(worker.id, selectedLang);
      setStage("email");
    } catch (error) {
      console.error("[Slang] Failed to set language", error);
      setError(ui.saveLanguageFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeLanguage = async () => {
    if (!selectedLang) return;
    setIsSaving(true);
    setError(undefined);
    try {
      await setWorkerLanguage(worker.id, selectedLang);
      router.replace(getWorkerSettingsPath(token));
    } catch (error) {
      console.error("[Slang] Failed to set language", error);
      setError(ui.saveLanguageFailed);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendOtp = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError(ui.invalidEmail);
      return;
    }

    setSendingOtp(true);
    setError(undefined);
    try {
      await validateWorkerInviteEmailForJoin(token, normalized);
      await sendManagerLoginOtp(normalized);
      setEmail(normalized);
      setOtp("");
      setStage("otp");
      setResendIn(60);
      lastOtpAttemptRef.current = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : ui.sendOtpFailed);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendIn > 0 || sendingOtp) return;
    setSendingOtp(true);
    setError(undefined);
    try {
      await sendManagerLoginOtp(email);
      setOtp("");
      setResendIn(60);
      lastOtpAttemptRef.current = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : ui.resendOtpFailed
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = useCallback(
    async (code?: string) => {
      if (verifyInFlightRef.current) return;

      const tokenValue = (code ?? otp).trim();
      if (!isCompleteOtpCode(tokenValue)) {
        setError(
          formatWorkerUi(ui.otpDigitsRequired, { length: EMAIL_OTP_LENGTH })
        );
        return;
      }

      verifyInFlightRef.current = true;
      setVerifyingOtp(true);
      setError(undefined);
      try {
        await verifyEmailOtp(email, tokenValue);
        await acceptWorkerInviteByToken(token);
        window.location.assign(getWorkerJoinPath(token));
      } catch (err) {
        lastOtpAttemptRef.current = tokenValue;
        setError(err instanceof Error ? err.message : ui.verifyFailed);
      } finally {
        verifyInFlightRef.current = false;
        setVerifyingOtp(false);
      }
    },
    [email, otp, token, ui]
  );

  useEffect(() => {
    if (
      stage !== "otp" ||
      verifyingOtp ||
      !isCompleteOtpCode(otp) ||
      lastOtpAttemptRef.current === otp
    ) {
      return;
    }
    lastOtpAttemptRef.current = otp;
    void handleVerifyOtp(otp);
  }, [otp, stage, verifyingOtp, handleVerifyOtp]);

  return (
    <MobileFrame dir={dir}>
      <div className="safe-top flex min-h-0 flex-1 flex-col bg-[var(--jobchat-surface)]">
        <div className="flex shrink-0 flex-col items-center justify-center px-4 pt-8 pb-4">
          <AuthBrandLogo size="compact" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-6">
          {isChangingLanguage ? (
            <div className="mb-4 text-center">
              <h1 className="text-lg font-semibold text-gray-900">
                {ui.changeLanguage}
              </h1>
            </div>
          ) : null}

          {stage === "language" && (
            <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto">
              <LanguagePicker selected={selectedLang} onSelect={setSelectedLang} />
            </div>
          )}

          {stage === "email" && (
            <div className="chat-scrollbar flex min-h-0 flex-1 flex-col justify-center overflow-y-auto py-4">
              <div className="rounded-3xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <h2 className="text-center text-xl font-semibold text-gray-900">
                  {ui.verifyEmailTitle}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                  {ui.verifyEmailSubtitle}
                </p>
                <Input
                  dir={dir}
                  align="center"
                  className="mt-5 !rounded-2xl"
                  label={ui.emailLabel}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="office@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSendOtp();
                  }}
                  error={error}
                  disabled={sendingOtp}
                />
              </div>
            </div>
          )}

          {stage === "otp" && (
            <div className="chat-scrollbar flex min-h-0 flex-1 flex-col justify-center overflow-y-auto py-4">
              <div className="rounded-3xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                    <KeyRound className="h-8 w-8 text-[var(--jobchat-accent)]" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    {ui.enterCodeTitle}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    {formatWorkerUi(ui.enterCodeSentPrefix, {
                      length: EMAIL_OTP_LENGTH,
                    })}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900" dir="ltr">
                    {email}
                  </p>
                </div>

                <OtpCodeInput
                  value={otp}
                  onChange={(next) => {
                    setOtp(next);
                    setError(undefined);
                  }}
                  disabled={verifyingOtp}
                  error={error}
                />

                <div className="mt-5 flex flex-col items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={sendingOtp || resendIn > 0}
                    className="font-medium text-[var(--jobchat-accent)] disabled:text-gray-400"
                  >
                    {resendIn > 0
                      ? formatWorkerUi(ui.resendInSeconds, { seconds: resendIn })
                      : ui.resendCode}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStage("email");
                      setOtp("");
                      setError(undefined);
                    }}
                    className="text-gray-500 active:opacity-70"
                  >
                    {ui.changeEmail}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
            <Button
              fullWidth
              className="!rounded-2xl"
              disabled={continueDisabled}
              onClick={() => {
                if (stage === "language") {
                  if (isChangingLanguage) {
                    void handleChangeLanguage();
                  } else {
                    void handleLanguageContinue();
                  }
                } else if (stage === "email") {
                  void handleSendOtp();
                } else {
                  void handleVerifyOtp();
                }
              }}
            >
              {stage === "otp"
                ? verifyingOtp
                  ? ui.verifying
                  : ui.verifyAndContinue
                : stage === "email"
                  ? sendingOtp
                    ? ui.sending
                    : ui.sendVerificationCode
                  : isSaving
                    ? ui.saving
                    : ui.continue}
            </Button>
          </div>
        </div>
      </div>
    </MobileFrame>
  );
}

function InvitePageContent({ token }: { token: string }) {
  const isChangingLanguage = useClientSearchParam("changeLang");
  const { loading, worker, invite, authRequired } = useInviteBootstrap(token);

  if (loading) {
    return (
      <MobileFrame>
        <AppLoadingState />
      </MobileFrame>
    );
  }

  if (!worker || !invite) {
    return (
      <MobileFrame>
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">הזמנה לא תקינה</h1>
          <p className="mt-2 text-sm text-gray-500">קישור ההזמנה אינו פעיל</p>
        </div>
      </MobileFrame>
    );
  }

  const showHome =
    worker.language &&
    worker.email &&
    isWorkerJoined(worker) &&
    !authRequired &&
    !isChangingLanguage;

  if (showHome) {
    return (
      <WorkerHome
        token={token}
        workerId={worker.id}
        companyName={invite.companyName}
        language={worker.language as LanguageCode}
      />
    );
  }

  return (
    <InviteOnboarding token={token} worker={worker} />
  );
}
