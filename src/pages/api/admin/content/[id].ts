import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireDashboardAuth } from "@/lib/auth";
import { logAction } from "@/lib/log";

const MAX = { key: 120, value: 4000, lang: 10 };

// PUT — update content entry
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role === "reader") return new Response(JSON.stringify({ error: "Insufficient role" }), { status: 403 });

  const id = params.id;
  if (!id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const body = await request.json() as { value: string; lang?: string; key?: string };
  const { value, lang, key } = body;

  const trimmedValue = value?.trim() ?? "";
  if (!trimmedValue)
    return new Response(JSON.stringify({ error: "Value required" }), { status: 400 });
  if (trimmedValue.length > MAX.value)
    return new Response(JSON.stringify({ error: `Value must be at most ${MAX.value} characters` }), { status: 400 });

  const supabase = createSupabaseServerClient(cookies, request);

  if (id === "new") {
    if (!lang || !key)
      return new Response(JSON.stringify({ error: "Key and lang required for new entry" }), { status: 400 });

    // Validate lang — whitelist known values, allow short custom codes
    const trimmedLang = lang.trim().toLowerCase();
    if (!trimmedLang || trimmedLang.length > MAX.lang || !/^[a-z]{2,10}$/.test(trimmedLang))
      return new Response(JSON.stringify({ error: "Invalid language code" }), { status: 400 });

    // Validate key format: alphanumeric + dots + underscores
    const trimmedKey = key.trim();
    if (!trimmedKey || trimmedKey.length > MAX.key || !/^[a-zA-Z0-9._-]+$/.test(trimmedKey))
      return new Response(JSON.stringify({ error: "Invalid key format" }), { status: 400 });

    const { data, error } = await supabase
      .from("content")
      .upsert({ key: trimmedKey, lang: trimmedLang, value: trimmedValue }, { onConflict: "key,lang" })
      .select("id")
      .single();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    await logAction(supabase, staff.id, "upsert_content", "content", data.id, { key: trimmedKey, lang: trimmedLang });
    return new Response(JSON.stringify({ ok: true, id: data.id }), { status: 200 });
  }

  // Validate id is a UUID to prevent path traversal
  if (!/^[0-9a-f-]{36}$/.test(id))
    return new Response(JSON.stringify({ error: "Invalid id" }), { status: 400 });

  const { error } = await supabase.from("content").update({ value: trimmedValue }).eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  await logAction(supabase, staff.id, "edit_content", "content", id, { value: trimmedValue });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
