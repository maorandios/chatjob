import { normalizeEmail } from "@/lib/auth/email";
import { resolveManagerIdForLogin } from "@/lib/auth/find-manager-by-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const managerId = await resolveManagerIdForLogin(email);
    if (!managerId) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 });
    }

    return NextResponse.json({ managerId });
  } catch (error) {
    console.error("Resolve manager error:", error);
    return NextResponse.json(
      { error: "Failed to resolve manager" },
      { status: 500 }
    );
  }
}
