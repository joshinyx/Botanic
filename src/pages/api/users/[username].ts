import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET: APIRoute = async ({ params, request, cookies }) => {
  const username = params.username;
  if (!username) return json({ error: "Not found" }, 404);

  const supabase = createSupabaseServerClient(cookies, request);

  const { data: user } = await supabase
    .from("users")
    .select("id, name, username, bio, social_links, avatar_url, followers_count, following_count")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (!user) return json({ error: "Not found" }, 404);

  const { count } = await supabase
    .from("plants")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "approved");

  return json({ ...user, plants_count: count ?? 0 });
};
