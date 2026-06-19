"use client";

import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { AuthBrandLogo } from "@/components/manager/AuthBrandLogo";
import { LoginGreetingsLottie } from "@/components/manager/LoginGreetingsLottie";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { EMAIL_OTP_LENGTH, isCompleteOtpCode } from "@/lib/auth/otp";
import { sendManagerLoginOtp } from "@/lib/auth/send-manager-otp";
import { getPostAuthManagerPath } from "@/lib/auth/post-auth-redirect";
import {
  resolveManagerIdByEmail,
  signOutSupabaseAuth,
  verifyEmailOtp,
} from "@/lib/auth/manager-auth";
import { useSlangStore } from "@/lib/store";
import { KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type LoginStep = "form" | "otp";

const RESEND_COOLDOWN_SEC = 60;
const FIELD_ROUNDED = "!rounded-2xl";
const LOGIN_CARD_CLASS =
  "rounded-3xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]";

export function ManagerLoginView() {
  const router = useRouter();
  const signInManager = useSlangStore((s) => s.signInManager);
  const [mounted, setMounted] = useState(false);

  const [step, setStep] = useState<LoginStep>("form");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
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

  const handleVerifyOtp = useCallback(
    async (code?: string) => {
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
        setRedirecting(true);
        const { onboardingComplete } = useSlangStore.getState();
        router.replace(getPostAuthManagerPath(onboardingComplete));
      } catch (err) {
        await signOutSupabaseAuth();
        lastOtpAttemptRef.current = token;
        setError(err instanceof Error ? err.message : "האימות נכשל");
      } finally {
        setVerifying(false);
      }
    },
    [email, otp, router, signInManager]
  );

  useEffect(() => {
    if (step !== "otp" || verifying || redirecting || !isCompleteOtpCode(otp)) {
      return;
    }
    if (lastOtpAttemptRef.current === otp) return;
    lastOtpAttemptRef.current = otp;
    void handleVerifyOtp(otp);
  }, [otp, step, verifying, redirecting, handleVerifyOtp]);

  if (redirecting) {
    return (
      <AppShell dir="rtl">
        <div className="flex flex-1 flex-col items-center justify-center bg-[var(--jobchat-surface)] safe-top">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--jobchat-accent)]" />
          <p className="mt-4 text-sm text-gray-500">מעבירים אותך הלאה...</p>
        </div>
      </AppShell>
    );
  }

  if (!mounted) {
    return (
      <AppShell dir="rtl">
        <div className="flex min-h-0 flex-1 flex-col bg-[var(--jobchat-surface)] safe-top">
          <div className="flex shrink-0 flex-col items-center gap-3 px-4 pt-8">
            <LoginGreetingsLottie />
            <AuthBrandLogo size="compact" />
          </div>
          <div className="mt-10 shrink-0 px-4 pb-8">
            <div className="mx-auto w-full max-w-sm">
              <div className={LOGIN_CARD_CLASS}>
                <div className="h-12 animate-pulse rounded-2xl bg-white/60" />
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
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--jobchat-surface)] safe-top">
        <div
          className={
            step === "form"
              ? "flex shrink-0 flex-col items-center gap-3 px-4 pt-8"
              : "flex shrink-0 flex-col items-center px-4 pt-5 pb-2"
          }
        >
          {step === "form" && <LoginGreetingsLottie />}
          <AuthBrandLogo size="compact" />
        </div>

        <div className="chat-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-10">
          <div className="mx-auto w-full max-w-sm">
            {step === "form" ? (
              <div className={LOGIN_CARD_CLASS}>
                <div className="space-y-4">
                  <Input
                    dir="rtl"
                    align="center"
                    label='כתובת דוא"ל'
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="Office@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleSendOtp();
                    }}
                    error={error}
                    disabled={sending}
                    className={FIELD_ROUNDED}
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
                      "התחברות"
                    )}
                  </Button>

                  <p className="text-center text-xs leading-relaxed text-gray-400">
                    הזינו את כתובת המייל שלכם ונשלח אליכם קוד בעל 6 ספרות
                    להתחברות
                  </p>
                </div>
              </div>
            ) : (
              <div className={LOGIN_CARD_CLASS}>
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
                    onChange={(next) => {
                      setOtp(next);
                      setError(undefined);
                    }}
                    disabled={verifying || redirecting}
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
