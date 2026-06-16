"use client";

import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { EMAIL_OTP_LENGTH, isCompleteOtpCode } from "@/lib/auth/otp";
import { sendManagerLoginOtp } from "@/lib/auth/send-manager-otp";
import { getPostAuthManagerPath } from "@/lib/auth/post-auth-redirect";
import {
  resolveManagerIdByEmail,
  verifyEmailOtp,
} from "@/lib/auth/manager-auth";
import { useSlangStore } from "@/lib/store";
import { KeyRound, Loader2, Mail, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LoginStep = "form" | "otp";

type ManagerLoginViewProps = {
  banner?: string;
};

const RESEND_COOLDOWN_SEC = 60;

export function ManagerLoginView({ banner }: ManagerLoginViewProps) {
  const router = useRouter();
  const signInManager = useSlangStore((s) => s.signInManager);
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<LoginStep>("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const lastOtpAttemptRef = useRef("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const sendOtp = async (targetEmail: string) => {
    const normalized = normalizeEmail(targetEmail);
    await sendManagerLoginOtp(normalized);
    return normalized;
  };

  const handleSendOtp = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError("נא להזין כתובת אימייל תקינה");
      return;
    }

    setSending(true);
    setError(undefined);
    try {
      const sentTo = await sendOtp(normalized);
      setEmail(sentTo);
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

  const handleResend = async () => {
    if (resendIn > 0 || sending) return;
    setSending(true);
    setError(undefined);
    try {
      await sendOtp(email);
      setOtp("");
      setResendIn(RESEND_COOLDOWN_SEC);
      lastOtpAttemptRef.current = "";
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "לא ניתן לשלוח שוב את הקוד"
      );
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    const token = (code ?? otp).trim();
    if (!isCompleteOtpCode(token)) {
      setError(`נא להזין קוד בן ${EMAIL_OTP_LENGTH} ספרות`);
      return;
    }

    setVerifying(true);
    setError(undefined);
    try {
      await verifyEmailOtp(email, token);
      const managerId = await resolveManagerIdByEmail(email);
      await signInManager(managerId);
      const { onboardingComplete } = useSlangStore.getState();
      router.replace(getPostAuthManagerPath(onboardingComplete));
    } catch (err) {
      setError(err instanceof Error ? err.message : "האימות נכשל");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (step !== "otp" || verifying || !isCompleteOtpCode(otp)) return;
    if (lastOtpAttemptRef.current === otp) return;
    lastOtpAttemptRef.current = otp;
    void handleVerifyOtp(otp);
  }, [otp, step, verifying]);

  if (!mounted) {
    return (
      <AppShell dir="rtl">
        <div className="flex min-h-0 flex-1 flex-col bg-[var(--jobchat-surface)]">
          <header className="chrome-top shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3">
            <h1 className="text-xl font-semibold text-gray-900">Slang</h1>
          </header>
          <div className="flex flex-1 flex-col justify-center px-4 py-8">
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-8">
                <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-white/60" />
                <div className="mx-auto mt-5 h-7 w-32 animate-pulse rounded-lg bg-white/60" />
                <div className="mx-auto mt-3 h-4 w-full max-w-[240px] animate-pulse rounded bg-white/40" />
                <div className="mt-8 h-12 animate-pulse rounded-xl bg-white/60" />
                <div className="mt-4 h-12 animate-pulse rounded-2xl bg-white/40" />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell dir="rtl">
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--jobchat-surface)]">
        <header className="chrome-top shrink-0 border-b border-[var(--jobchat-border)] bg-white px-4 py-3">
          <h1 className="text-xl font-semibold text-gray-900">Slang</h1>
        </header>

        <div className="flex flex-1 flex-col justify-center px-4 py-8">
          <div className="mx-auto w-full max-w-sm">
            {banner && (
              <p className="mb-4 rounded-xl border border-[var(--jobchat-border)] bg-white/60 px-4 py-3 text-center text-sm text-gray-600">
                {banner}
              </p>
            )}

            {step === "form" ? (
              <div className="rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-8">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                    <MessageCircle className="h-8 w-8 text-[var(--jobchat-accent)]" />
                  </div>
                  <h2 className="mt-5 text-[22px] font-semibold tracking-tight text-gray-900">
                    הרשמה / התחברות
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    הזינו את כתובת המייל ונשלח אליכם קוד. מייל חדש יפתח חשבון
                    מנהל חדש.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    dir="ltr"
                    label="אימייל"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@example.com"
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
                    onClick={() => void handleSendOtp()}
                    disabled={sending}
                    className="!rounded-2xl"
                  >
                    {sending ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        שולח...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        שלח קוד התחברות
                      </span>
                    )}
                  </Button>
                </div>

                <p className="mt-6 text-center text-xs leading-relaxed text-gray-400">
                  אין צורך בסיסמה — מייל חדש נרשם אוטומטית כמנהל ראשי
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-8">
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                    <KeyRound className="h-8 w-8 text-[var(--jobchat-accent)]" />
                  </div>
                  <h2 className="mt-5 text-[22px] font-semibold text-gray-900">
                    הזינו את הקוד
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    שלחנו קוד בן {EMAIL_OTP_LENGTH} ספרות ל-
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900" dir="ltr">
                    {email}
                  </p>
                </div>

                <div className="space-y-4">
                  <OtpCodeInput
                    value={otp}
                    onChange={setOtp}
                    disabled={verifying}
                    error={error}
                  />

                  <Button
                    fullWidth
                    onClick={() => {
                      lastOtpAttemptRef.current = "";
                      void handleVerifyOtp();
                    }}
                    disabled={verifying || !isCompleteOtpCode(otp)}
                    className="!rounded-2xl"
                  >
                    {verifying ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        מאמת...
                      </span>
                    ) : (
                      "התחברות"
                    )}
                  </Button>
                </div>

                <div className="mt-6 flex flex-col items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => void handleResend()}
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
                    className="text-gray-500 active:opacity-70"
                  >
                    שינוי כתובת מייל
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
