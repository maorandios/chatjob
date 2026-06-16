"use client";

import { AuthBrandLogo } from "@/components/manager/AuthBrandLogo";
import { AppShell } from "@/components/ui/AppShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getAuthenticatedEmail } from "@/lib/auth/manager-auth";
import { useSlangStore } from "@/lib/store";
import { cn, isValidIsraeliPhone } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  Loader2,
  Phone,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";

type OnboardingStep = "company" | "name" | "phone" | "summary";

const STEP_ORDER: OnboardingStep[] = ["company", "name", "phone", "summary"];

const ONBOARDING_CARD_CLASS =
  "rounded-3xl border border-[var(--jobchat-border)] bg-white/25 px-5 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)]";

const FIELD_ROUNDED = "!rounded-2xl";

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
      <div className="flex min-h-0 flex-1 flex-col bg-[var(--jobchat-surface)] safe-top">
        <div className="flex min-h-[33dvh] shrink-0 flex-col items-center justify-center px-4 pt-6 pb-2">
          <AuthBrandLogo size="compact" />
        </div>

        <div className="shrink-0 px-4 pb-8">
          <div className="mx-auto w-full max-w-sm">
            <OnboardingProgress
              currentStep={stepIndex + 1}
              totalSteps={STEP_ORDER.length}
            />

            <div className={ONBOARDING_CARD_CLASS}>
              {step === "company" && (
                <StepHeader
                  icon={<Building2 className="h-5 w-5 text-[var(--jobchat-accent)]" />}
                  title="מה שם החברה?"
                />
              )}

              {step === "name" && (
                <StepHeader
                  icon={<UserRound className="h-5 w-5 text-[var(--jobchat-accent)]" />}
                  title="מה שמך המלא?"
                />
              )}

              {step === "phone" && (
                <StepHeader
                  icon={<Phone className="h-5 w-5 text-[var(--jobchat-accent)]" />}
                  title="מה מספר הטלפון שלך?"
                />
              )}

              {step === "summary" && (
                <div className="mb-5 text-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    סיכום לפני יצירת החשבון
                  </h2>
                  <p className="mt-1.5 text-sm text-gray-500">
                    ודאו שהפרטים נכונים לפני המשך
                  </p>
                </div>
              )}

              {step === "company" && (
                <Input
                  dir="rtl"
                  align="center"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                  placeholder="לדוגמה: כהן בנייה"
                  error={error}
                  autoFocus
                  className={FIELD_ROUNDED}
                />
              )}

              {step === "name" && (
                <Input
                  dir="rtl"
                  align="center"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                  placeholder="שם פרטי ושם משפחה"
                  error={error}
                  autoFocus
                  className={FIELD_ROUNDED}
                />
              )}

              {step === "phone" && (
                <Input
                  dir="rtl"
                  align="center"
                  inputDir="ltr"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goNext()}
                  placeholder="050-1234567"
                  error={error}
                  autoFocus
                  className={FIELD_ROUNDED}
                />
              )}

              {step === "summary" && (
                <>
                  <div className="space-y-4 text-center">
                    <SummaryRow label="שם החברה" value={companyName} />
                    <SummaryRow label="שם מלא" value={fullName} />
                    <SummaryRow
                      label="טלפון"
                      value={phone}
                      valueDir="ltr"
                    />
                    {email ? (
                      <SummaryRow
                        label="אימייל"
                        value={email}
                        valueDir="ltr"
                      />
                    ) : null}
                  </div>
                  {error && (
                    <p className="mt-3 text-center text-sm text-red-600">
                      {error}
                    </p>
                  )}
                  <div className="mt-6 flex items-center gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0 !rounded-2xl px-4"
                      onClick={goBack}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowRight className="h-4 w-4" />
                        חזרה
                      </span>
                    </Button>
                    <Button
                      fullWidth
                      className="!rounded-2xl"
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
                  </div>
                </>
              )}

              {step !== "summary" && (
                <div className="mt-6 flex items-center gap-3">
                  {stepIndex > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="shrink-0 !rounded-2xl px-4"
                      onClick={goBack}
                    >
                      <span className="inline-flex items-center gap-1.5">
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
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function OnboardingProgress({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="mb-6 flex items-center justify-center">
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isComplete = stepNumber < currentStep;

        return (
          <Fragment key={stepNumber}>
            {index > 0 && (
              <div
                className={cn(
                  "h-0.5 w-7 sm:w-10",
                  isComplete || isActive
                    ? "bg-[var(--jobchat-accent)]"
                    : "bg-gray-200"
                )}
              />
            )}
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                isActive &&
                  "bg-[var(--jobchat-accent)] text-white shadow-sm",
                isComplete &&
                  "bg-[var(--jobchat-accent-light)] text-[var(--jobchat-accent)]",
                !isActive &&
                  !isComplete &&
                  "bg-white text-gray-400 ring-1 ring-[var(--jobchat-border)]"
              )}
            >
              {stepNumber}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

function StepHeader({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="mb-5 flex flex-col items-center gap-2 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jobchat-accent-light)]">
        {icon}
      </div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueDir = "rtl",
}: {
  label: string;
  value: string;
  valueDir?: "ltr" | "rtl";
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className="mt-1 text-sm font-medium text-gray-900"
        dir={valueDir}
      >
        {value}
      </p>
    </div>
  );
}
