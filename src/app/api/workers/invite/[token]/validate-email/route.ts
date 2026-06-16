import { isValidEmail, normalizeEmail } from "@/lib/auth/email";
import { validateWorkerInviteEmail } from "@/lib/auth/accept-worker-invite";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "נא להזין כתובת אימייל תקינה" },
        { status: 400 }
      );
    }

    await validateWorkerInviteEmail(token, email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("כבר בשימוש") ||
        error.message.includes("כבר שויכה")
      ) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("אינו תקין")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    console.error("Validate worker invite email error:", error);
    return NextResponse.json(
      { error: "לא ניתן לבדוק את כתובת המייל" },
      { status: 500 }
    );
  }
}
