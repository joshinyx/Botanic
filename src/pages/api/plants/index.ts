import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request, cookies }) => {
  const url    = new URL(request.url);
  const name     = url.searchParams.get("name")     ?? "";
  const tagsRaw  = url.searchParams.get("tags")     ?? "";
  const country  = url.searchParams.get("country")  ?? "";
  const climate  = url.searchParams.get("climate")  ?? "";
  const duration = url.searchParams.get("duration") ?? "";
  const author   = url.searchParams.get("author")   ?? "";
  const tags     = tagsRaw ? tagsRaw.split(",").filter(Boolean) : [];

  const supabase = createSupabaseServerClient(cookies, request);

  let query = supabase
    .from("plants")
    .select("*, users(username, name)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(120);

  if (name)         query = query.ilike("name", `%${name}%`);
  if (country)      query = query.eq("origin_country", country);
  if (climate)      query = query.eq("climate", climate);
  if (duration)     query = query.eq("duration", duration);
  if (tags.length)  query = query.contains("tags", tags);
  if (author) {
    const { data: userRow } = await supabase
      .from("users").select("id").eq("username", author).maybeSingle();
    query = query.eq("user_id", userRow?.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);

  return json({ plants: data ?? [] });
};
