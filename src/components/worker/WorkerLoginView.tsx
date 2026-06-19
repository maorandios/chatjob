"use client";

import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { AuthBrandLogo } from "@/components/manager/AuthBrandLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { verifyEmailOtp } from "@/lib/auth/manager-auth";
import { EMAIL_OTP_LENGTH, isCompleteOtpCode } from "@/lib/auth/otp";
import { sendManagerLoginOtp } from "@/lib/auth/send-manager-otp";
import { resolveWorkerInviteTokenByEmail } from "@/lib/auth/worker-auth";
import { getWorkerJoinPath } from "@/lib/utils";
import { KeyRound, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const RESEND_COOLDOWN_SEC = 60;
const FIELD_ROUNDED = "!rounded-2xl";
const CARD_CLASS =
  "rounded-3xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]";

export function WorkerLoginView() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const lastOtpAttemptRef = useRef("");
  const verifyInFlightRef = useRef(false);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const handleSendOtp = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("נא להזין כתובת אימייל תקינה");
      return;
    }

    setSending(true);
    setError(undefined);
    try {
      await sendManagerLoginOtp(normalized);
      setEmail(normalized);
      setOtp("");
      setStep("otp");
      setResendIn(RESEND_COOLDOWN_SEC);
      lastOtpAttemptRef.current = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "לא ניתן לשלוח את קוד האימות"
      );
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = useCallback(
    async (code?: string) => {
      if (verifyInFlightRef.current) return;
      const token = (code ?? otp).trim();
      if (!isCompleteOtpCode(token)) {
        setError(`נא להזין קוד בן ${EMAIL_OTP_LENGTH} ספרות`);
        return;
      }

      verifyInFlightRef.current = true;
      setVerifying(true);
      setError(undefined);
      try {
        await verifyEmailOtp(email, token);
        const { inviteToken } = await resolveWorkerInviteTokenByEmail(email);
        window.location.assign(getWorkerJoinPath(inviteToken));
      } catch (err) {
        lastOtpAttemptRef.current = "";
        setError(err instanceof Error ? err.message : "האימות נכשל");
      } finally {
        verifyInFlightRef.current = false;
        setVerifying(false);
      }
    },
    [email, otp]
  );

  useEffect(() => {
    if (
      step !== "otp" ||
      verifying ||
      !isCompleteOtpCode(otp) ||
      lastOtpAttemptRef.current === otp
    ) {
      return;
    }
    lastOtpAttemptRef.current = otp;
    void handleVerifyOtp(otp);
  }, [otp, step, verifying, handleVerifyOtp]);

  return (
    <div className="safe-top flex min-h-0 flex-1 flex-col bg-[var(--jobchat-surface)]">
      <div className="flex shrink-0 flex-col items-center justify-center px-4 pt-8 pb-4">
        <AuthBrandLogo size="compact" />
      </div>

      <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-6">
        <div className="mx-auto w-full max-w-sm">
          {step === "form" ? (
            <div className={CARD_CLASS}>
              <h2 className="text-center text-xl font-semibold text-gray-900">
                התחברות לעובד
              </h2>
              <p className="mt-2 text-center text-sm text-gray-500">
                הזינו את כתובת המייל שאיתה נרשמתם ונשלח קוד אימות.
              </p>

              <Input
                dir="rtl"
                align="center"
                className={`mt-5 ${FIELD_ROUNDED}`}
                label='כתובת דוא"ל'
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
                disabled={sending}
              />

              <Button
                fullWidth
                className="mt-5 !rounded-2xl"
                onClick={() => void handleSendOtp()}
                disabled={sending}
              >
                {sending ? "שולח..." : "שליחת קוד אימות"}
              </Button>
            </div>
          ) : (
            <div className={CARD_CLASS}>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                  <KeyRound className="h-8 w-8 text-[var(--jobchat-accent)]" />
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  הזינו את הקוד
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  שלחנו קוד בן {EMAIL_OTP_LENGTH} ספרות ל-
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900" dir="ltr">
                  {email}
                </p>
              </div>

              <OtpCodeInput
                value={otp}
                onChange={setOtp}
                disabled={verifying}
                error={error}
              />

              <Button
                fullWidth
                className="mt-5 !rounded-2xl"
                onClick={() => void handleVerifyOtp()}
                disabled={verifying || !isCompleteOtpCode(otp)}
              >
                {verifying ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    מאמת...
                  </span>
                ) : (
                  "אימות והתחברות"
                )}
              </Button>

              <div className="mt-5 flex flex-col items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (resendIn <= 0) void handleSendOtp();
                  }}
                  disabled={sending || resendIn > 0}
                  className="font-medium text-[var(--jobchat-accent)] disabled:text-gray-400"
                >
                  {resendIn > 0
                    ? `שליחה מחדש בעוד ${resendIn} שניות`
                    : "שלח קוד מחדש"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    setError(undefined);
                    lastOtpAttemptRef.current = "";
                  }}
                  className="text-gray-500"
                >
                  שינוי כתובת מייל
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
