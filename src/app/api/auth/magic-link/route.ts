import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { NextResponse } from "next/server";

/** Validates email format. OTP send runs in the browser via Supabase Auth. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email) {
      return NextResponse.json({ error: "נא להזין אימייל" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "נא להזין כתובת אימייל תקינה" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Magic link check error:", error);
    return NextResponse.json(
      { error: "Failed to validate login email" },
      { status: 500 }
    );
  }
}
