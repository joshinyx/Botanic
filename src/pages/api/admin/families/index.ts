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

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await requireEditor(cookies, request);
  if (!user) return json({ error: "Forbidden" }, 403);

  const body = await request.json() as { key?: string; label_es?: string; label_en?: string };
  const key      = body.key?.trim().toLowerCase();
  const label_es = body.label_es?.trim();
  const label_en = body.label_en?.trim();

  if (!key || !label_es || !label_en) return json({ error: "key, label_es y label_en son obligatorios" }, 400);
  if (!/^[a-z0-9_-]+$/.test(key)) return json({ error: "La clave solo puede tener letras minúsculas, números, guiones o guiones bajos" }, 400);

  const admin = createSupabaseAdminClient();
  const { data: maxRow } = await admin.from("plant_families").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const sort_order = ((maxRow as { sort_order: number } | null)?.sort_order ?? 0) + 1;

  const { error } = await admin.from("plant_families").insert({ key, label_es, label_en, active: true, sort_order });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true, key });
};
