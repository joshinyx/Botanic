import type { APIRoute } from "astro";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function requireEditor(cookies: Parameters<APIRoute>[0]["cookies"], request: Request) {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("users").select("role").eq("id", user.id).maybeSingle();
  if (!data?.role || !["super_admin", "editor"].includes(data.role)) return null;
  return user;
}

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  const user = await requireEditor(cookies, request);
  if (!user) return json({ error: "Forbidden" }, 403);

  const key = params.key!;
  const body = await request.json() as { label_es?: string; label_en?: string; active?: boolean };

  const update: Record<string, unknown> = {};
  if (typeof body.label_es === "string") update.label_es = body.label_es.trim();
  if (typeof body.label_en === "string") update.label_en = body.label_en.trim();
  if (typeof body.active  === "boolean") update.active   = body.active;

  if (Object.keys(update).length === 0) return json({ error: "Nothing to update" }, 400);

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("plant_families").update(update).eq("key", key);
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ cookies, request, params }) => {
  const user = await requireEditor(cookies, request);
  if (!user) return json({ error: "Forbidden" }, 403);

  const key = params.key!;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("plant_families").delete().eq("key", key);
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
};
