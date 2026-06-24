import {
  assertAuthenticatedWorkerRequest,
} from "@/lib/supabase/company-access";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { rowToWorker } from "@/lib/supabase/mappers";
import { uploadWorkerProfileImage } from "@/lib/supabase/worker-profile-image";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const imageDataUrl = String(body.imageDataUrl ?? "");

    if (!(await assertAuthenticatedWorkerRequest(req, id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: existingWorker, error: existingWorkerError } = await supabase
      .from("workers")
      .select("company_id")
      .eq("id", id)
      .maybeSingle();

    if (existingWorkerError) throw existingWorkerError;
    if (!existingWorker?.company_id) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const profileImageUrl = await uploadWorkerProfileImage(
      existingWorker.company_id,
      id,
      imageDataUrl
    );

    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      worker: rowToWorker(data),
      profileImageUrl,
    });
  } catch (error) {
    console.error("Upload worker profile image error:", error);
    return NextResponse.json(
      { error: "Failed to upload profile image" },
      { status: 500 }
    );
  }
}
