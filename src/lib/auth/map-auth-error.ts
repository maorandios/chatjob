export function mapSupabaseAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("signup") || lower.includes("signups not allowed")) {
    return "הרשמה במייל כבויה ב-Supabase. הפעילו Enable email signup ב-Authentication → Providers → Email.";
  }
  if (
    lower.includes("otp_expired") ||
    lower.includes("expired") ||
    lower.includes("invalid")
  ) {
    return "קוד האימות שגוי או שפג תוקפו. בדקו את הקוד ונסו שוב.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "יותר מדי בקשות. נסו שוב בעוד כמה דקות.";
  }
  if (lower.includes("redirect")) {
    return "כתובת החזרה לא מוגדרת ב-Supabase. הוסיפו /manager/auth/callback ל-Redirect URLs.";
  }
  if (lower.includes("smtp")) {
    return "שליחת המייל נכשלה. בדקו את חיבור Resend ב-Supabase (SMTP / Custom SMTP).";
  }
  if (lower.includes("forbidden") || lower.includes("403")) {
    return "אימות הקוד נדחה. ודאו ש-Enable email signup פעיל ב-Supabase, ושתבנית המייל כוללת {{ .Token }}.";
  }

  return `לא ניתן לאמת את הקוד (${message})`;
}
