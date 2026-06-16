export function getPostAuthManagerPath(onboardingComplete: boolean): string {
  return onboardingComplete ? "/manager" : "/manager/onboarding";
}
