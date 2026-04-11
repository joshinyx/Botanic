import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// POST /api/follow  — follow a user
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json() as { followingId?: string };
  const followingId = body.followingId?.trim();
  if (!followingId) return json({ error: "followingId is required" }, 400);
  if (followingId === user.id) return json({ error: "Cannot follow yourself" }, 400);

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: followingId });

  if (error) {
    // 23505 = unique_violation (already following)
    if (error.code === "23505") return json({ error: "Already following" }, 409);
    return json({ error: error.message }, 500);
  }

  return json({ ok: true });
};

// DELETE /api/follow  — unfollow a user
export const DELETE: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json() as { followingId?: string };
  const followingId = body.followingId?.trim();
  if (!followingId) return json({ error: "followingId is required" }, 400);

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};
