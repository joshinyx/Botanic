import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ request, cookies }) => {
  const url      = new URL(request.url);
  const name     = url.searchParams.get("name")    ?? "";
  const tagsRaw  = url.searchParams.get("tags")    ?? "";
  const author   = url.searchParams.get("author")  ?? "";
  const tags     = tagsRaw ? tagsRaw.split(",").filter(Boolean) : [];
  const country  = url.searchParams.get("country")?.split(",").filter(Boolean)  ?? [];
  const climate  = url.searchParams.get("climate")?.split(",").filter(Boolean)  ?? [];
  const duration = url.searchParams.get("duration")?.split(",").filter(Boolean) ?? [];
  const family   = url.searchParams.get("family")?.split(",").filter(Boolean)   ?? [];

  const supabase = createSupabaseServerClient(cookies, request);

  let query = supabase
    .from("plants")
    .select("*, users(username, name, bio, avatar_url, followers_count, following_count)")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(120);

  if (name)            query = query.ilike("name", `%${name}%`);
  if (country.length)  query = query.in("origin_country", country);
  if (climate.length)  query = query.in("climate", climate);
  if (duration.length) query = query.in("duration", duration);
  if (tags.length)     query = query.contains("tags", tags);
  if (family.length)   query = query.in("family", family);
  if (author) {
    const { data: userRow } = await supabase
      .from("users").select("id").eq("username", author).maybeSingle();
    query = query.eq("user_id", userRow?.id ?? "00000000-0000-0000-0000-000000000000");
  }

  const { data, error } = await query;
  if (error) return json({ error: error.message }, 500);

  return json({ plants: data ?? [] });
};
