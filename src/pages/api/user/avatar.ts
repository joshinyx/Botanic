import type { APIRoute } from "astro";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";

const MAX_SIZE   = 2 * 1024 * 1024; // 2 MB
const ALLOWED    = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const BUCKET     = "avatars";

// POST — upload / replace avatar
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const form = await request.formData();
  const file = form.get("avatar");

  if (!(file instanceof File))
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  if (!ALLOWED.includes(file.type))
    return new Response(JSON.stringify({ error: "Invalid format. Use JPG, PNG, WebP or GIF." }), { status: 400 });
  if (file.size > MAX_SIZE)
    return new Response(JSON.stringify({ error: "File too large (max 2 MB)." }), { status: 400 });

  const path = `${user.id}/avatar`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const admin  = createSupabaseAdminClient();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError)
    return new Response(JSON.stringify({ error: uploadError.message }), { status: 500 });

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);
  const versionedUrl = `${publicUrl}?v=${Date.now()}`;

  // Persist URL in users table (versioned to bust CDN/browser cache on re-upload)
  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: versionedUrl })
    .eq("id", user.id);

  if (updateError)
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true, url: versionedUrl }), { status: 200 });
};

// DELETE — remove avatar
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const admin = createSupabaseAdminClient();
  // Remove regardless of what was stored (single consistent path)
  await admin.storage.from(BUCKET).remove([`${user.id}/avatar`]);

  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", user.id);

  if (error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
