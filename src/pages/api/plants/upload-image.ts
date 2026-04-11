import type { APIRoute } from "astro";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";

const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED  = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const BUCKET   = "plant-images";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const form = await request.formData();
  const file = form.get("image");

  if (!(file instanceof File))       return json({ error: "No file provided" }, 400);
  if (!ALLOWED.includes(file.type))  return json({ error: "Invalid format. Use JPG, PNG, WebP or AVIF." }, 400);
  if (file.size > MAX_SIZE)          return json({ error: "File too large (max 5 MB)." }, 400);

  const ext   = file.type.split("/")[1].replace("jpeg", "jpg");
  const path  = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin  = createSupabaseAdminClient();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return json({ error: uploadError.message }, 500);

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);

  return json({ ok: true, url: publicUrl });
};
