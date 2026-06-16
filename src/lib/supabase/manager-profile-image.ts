import { parseDataUrl } from "@/lib/server/data-url";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = "manager-profiles";

export async function uploadManagerProfileImage(
  companyId: string,
  managerId: string,
  imageDataUrl: string
): Promise<string> {
  const { contentType, buffer } = parseDataUrl(imageDataUrl);

  if (!contentType.startsWith("image/")) {
    throw new Error("Invalid image type");
  }

  if (buffer.byteLength > 2 * 1024 * 1024) {
    throw new Error("Image file too large");
  }

  const supabase = getSupabaseAdmin();
  const path = `${companyId}/${managerId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: contentType === "image/png" ? "image/jpeg" : contentType,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const versionedUrl = `${data.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("managers")
    .update({ profile_image_url: versionedUrl })
    .eq("id", managerId)
    .eq("company_id", companyId);

  if (updateError) throw updateError;

  return versionedUrl;
}
