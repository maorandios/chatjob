import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  assertManagerIsAdmin,
  assertSameCompanyParticipants,
} from "@/lib/supabase/company-access";
import { rowToWorker } from "@/lib/supabase/mappers";
import { normalizeWorkerLanguage } from "@/lib/i18n/languages";
import { isValidIsraeliPhone, normalizePhone } from "@/lib/utils";
import type { LanguageCode } from "@/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const updates: {
      language?: string;
      status?: "pending" | "active";
      name?: string;
      phone?: string;
      employee_number?: string | null;
      address?: string | null;
    } = {};

    if (body.language) {
      updates.language = normalizeWorkerLanguage(body.language as LanguageCode);
    } else if (body.status === "pending" || body.status === "active") {
      updates.status = body.status;
    }

    if (
      body.name !== undefined ||
      body.phone !== undefined ||
      body.employeeNumber !== undefined ||
      body.address !== undefined
    ) {
      const managerId = String(body.managerId ?? "");
      if (!managerId) {
        return NextResponse.json({ error: "managerId required" }, { status: 400 });
      }

      const companyId = await assertSameCompanyParticipants(managerId, id);
      if (!companyId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (!name) {
          return NextResponse.json({ error: "Invalid name" }, { status: 400 });
        }
        updates.name = name;
      }

      if (body.phone !== undefined) {
        const phone = normalizePhone(String(body.phone));
        if (!isValidIsraeliPhone(phone)) {
          return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
        }
        updates.phone = phone;
      }

      if (body.employeeNumber !== undefined) {
        const employeeNumber = String(body.employeeNumber).trim();
        updates.employee_number = employeeNumber || null;
      }

      if (body.address !== undefined) {
        const address = String(body.address).trim();
        updates.address = address || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("workers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ worker: rowToWorker(data) });
  } catch (error) {
    console.error("Update worker error:", error);
    return NextResponse.json({ error: "Failed to update worker" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const managerId = searchParams.get("managerId");

    if (!managerId) {
      return NextResponse.json({ error: "managerId required" }, { status: 400 });
    }

    const adminCheck = await assertManagerIsAdmin(managerId);
    if (!adminCheck) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { data: worker, error: lookupError } = await supabase
      .from("workers")
      .select("company_id")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) throw lookupError;
    if (!worker) {
      return NextResponse.json({ error: "Worker not found" }, { status: 404 });
    }

    if (worker.company_id !== adminCheck.companyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("workers").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete worker error:", error);
    return NextResponse.json({ error: "Failed to delete worker" }, { status: 500 });
  }
}
