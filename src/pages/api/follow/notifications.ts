import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// PATCH /api/follow/notifications  — toggle per-user notification preference
export const PATCH: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json() as { followingId?: string; enabled?: boolean };
  const followingId = body.followingId?.trim();
  if (!followingId) return json({ error: "followingId is required" }, 400);
  if (typeof body.enabled !== "boolean") return json({ error: "enabled (boolean) is required" }, 400);

  const { error } = await supabase
    .from("follows")
    .update({ notifications_enabled: body.enabled })
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};
