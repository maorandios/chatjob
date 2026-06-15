/** Match Supabase → Authentication → Providers → Email → OTP length (6–10). */
export const EMAIL_OTP_LENGTH = Number(
  process.env.NEXT_PUBLIC_EMAIL_OTP_LENGTH ?? "6"
);

export function isCompleteOtpCode(code: string): boolean {
  return code.trim().length === EMAIL_OTP_LENGTH;
}
