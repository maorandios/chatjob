import {
  assertAuthenticatedWorkerRequest,
  getWorkerCompanyId,
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

    const companyId = await getWorkerCompanyId(id);
    if (!companyId) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    const profileImageUrl = await uploadWorkerProfileImage(
      companyId,
      id,
      imageDataUrl
    );

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
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
