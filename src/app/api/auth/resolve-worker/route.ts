import { normalizeEmail } from "@/lib/auth/email";
import {
  mapResolveWorkerError,
  resolveWorkerInviteByEmail,
} from "@/lib/auth/find-worker-by-email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(String(body.email ?? ""));

    if (!email) {
      return NextResponse.json({ error: "נא להזין אימייל" }, { status: 400 });
    }

    const resolved = await resolveWorkerInviteByEmail(email);
    return NextResponse.json(resolved);
  } catch (error) {
    console.error("Resolve worker error:", error);
    return NextResponse.json(
      { error: mapResolveWorkerError(error) },
      { status: 500 }
    );
  }
}
