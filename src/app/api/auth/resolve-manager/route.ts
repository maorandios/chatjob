import { normalizeEmail } from "@/lib/auth/email";
import {
  mapResolveManagerError,
  resolveManagerIdForLogin,
} from "@/lib/auth/find-manager-by-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email) {
      return NextResponse.json({ error: "נא להזין אימייל" }, { status: 400 });
    }

    const managerId = await resolveManagerIdForLogin(email);
    return NextResponse.json({ managerId });
  } catch (error) {
    console.error("Resolve manager error:", error);
    return NextResponse.json(
      { error: mapResolveManagerError(error) },
      { status: 500 }
    );
  }
}
