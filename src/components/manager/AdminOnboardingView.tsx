"use client";

import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuthenticatedEmail } from "@/lib/auth/manager-auth";
import { useSlangStore } from "@/lib/store";
import { isValidIsraeliPhone } from "@/lib/utils";
import { ArrowRight, Building2, Loader2, Phone, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OnboardingStep = "company" | "name" | "phone" | "summary";

const STEP_ORDER: OnboardingStep[] = ["company", "name", "phone", "summary"];

export function AdminOnboardingView() {
  const router = useRouter();
  const completeOnboarding = useSlangStore((s) => s.completeOnboarding);

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("company");
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    void getAuthenticatedEmail()
      .then(setEmail)
      .catch(() => setEmail(""));
  }, []);

  const stepIndex = STEP_ORDER.indexOf(step);

  const goBack = () => {
    if (stepIndex <= 0) return;
    setError(undefined);
    setStep(STEP_ORDER[stepIndex - 1]!);
  };

  const goNext = () => {
    setError(undefined);

    if (step === "company") {
      if (!companyName.trim()) {
        setError("נא להזין שם חברה");
        return;
      }
      setStep("name");
      return;
    }

    if (step === "name") {
      if (!fullName.trim()) {
        setError("נא להזין שם מלא");
        return;
      }
      setStep("phone");
      return;
    }

    if (step === "phone") {
      if (!isValidIsraeliPhone(phone)) {
        setError("נא להזין מספר טלפון תקין");
        return;
      }
      setStep("summary");
    }
  };

  const handleCreateAccount = async () => {
    setSubmitting(true);
    setError(undefined);
    try {
      await completeOnboarding({
        companyName: companyName.trim(),
        fullName: fullName.trim(),
        phone,
      });
      router.replace("/manager");
    } catch (err) {
      setError(err instanceof Error ? err.message : "לא ניתן ליצור את החשבון");
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <AppShell dir="rtl">
        <div className="flex min-h-0 flex-1 items-center justify-center bg-[var(--jobchat-surface)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--jobchat-accent)]" />
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

        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-sm text-center">
            {step === "company" && (
              <>
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                  <Building2 className="h-7 w-7 text-[var(--jobchat-accent)]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  מה שם החברה?
                </h2>
                <div className="mt-8">
                  <Input
                    dir="rtl"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    placeholder="לדוגמה: כהן בנייה"
                    error={error}
                    autoFocus
                  />
                </div>
              </>
            )}

            {step === "name" && (
              <>
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                  <UserRound className="h-7 w-7 text-[var(--jobchat-accent)]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  מה שמך המלא?
                </h2>
                <div className="mt-8">
                  <Input
                    dir="rtl"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    placeholder="שם פרטי ושם משפחה"
                    error={error}
                    autoFocus
                  />
                </div>
              </>
            )}

            {step === "phone" && (
              <>
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
                  <Phone className="h-7 w-7 text-[var(--jobchat-accent)]" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  מה מספר הטלפון שלך?
                </h2>
                <div className="mt-8">
                  <Input
                    dir="ltr"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && goNext()}
                    placeholder="050-1234567"
                    error={error}
                    autoFocus
                  />
                </div>
              </>
            )}

            {step === "summary" && (
              <>
                <h2 className="text-2xl font-semibold text-gray-900">
                  סיכום לפני יצירת החשבון
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  ודאו שהפרטים נכונים לפני המשך
                </p>
                <div className="mt-8 space-y-4 rounded-2xl border border-[var(--jobchat-border)] bg-white/25 px-4 py-5 text-start">
                  <SummaryRow label="שם החברה" value={companyName} />
                  <SummaryRow label="שם מלא" value={fullName} />
                  <SummaryRow label="טלפון" value={phone} dir="ltr" />
                  {email ? (
                    <SummaryRow label="אימייל" value={email} dir="ltr" />
                  ) : null}
                </div>
                {error && (
                  <p className="mt-3 text-sm text-red-600">{error}</p>
                )}
                <Button
                  fullWidth
                  className="mt-8 !rounded-2xl"
                  onClick={() => void handleCreateAccount()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      יוצר חשבון...
                    </span>
                  ) : (
                    "יצירת חשבון"
                  )}
                </Button>
              </>
            )}

            {step !== "summary" && (
              <div className="mt-8 flex items-center gap-3">
                {stepIndex > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="!rounded-2xl"
                    onClick={goBack}
                  >
                    <span className="inline-flex items-center gap-1">
                      <ArrowRight className="h-4 w-4" />
                      חזרה
                    </span>
                  </Button>
                )}
                <Button
                  fullWidth
                  className="!rounded-2xl"
                  onClick={goNext}
                >
                  המשך
                </Button>
              </div>
            )}

            {step !== "summary" && (
              <p className="mt-6 text-xs text-gray-400">
                שלב {stepIndex + 1} מתוך {STEP_ORDER.length}
              </p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SummaryRow({
  label,
  value,
  dir = "rtl",
}: {
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900" dir={dir}>
        {value}
      </p>
    </div>
  );
}
