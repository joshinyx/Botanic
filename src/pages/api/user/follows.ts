import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

export const GET: APIRoute = async ({ url, cookies, request }) => {
  const userId   = url.searchParams.get("userId");
  const type     = url.searchParams.get("type");
  const viewerId = url.searchParams.get("viewerId") ?? null;

  if (!userId || (type !== "followers" && type !== "following")) {
    return new Response(JSON.stringify({ error: "Invalid params" }), { status: 400 });
  }

  const supabase = createSupabaseServerClient(cookies, request);

  let userIds: string[] = [];

  if (type === "followers") {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", userId)
      .limit(100);
    userIds = (data ?? []).map((r) => r.follower_id as string);
  } else {
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId)
      .limit(100);
    userIds = (data ?? []).map((r) => r.following_id as string);
  }

  if (userIds.length === 0) {
    return new Response(JSON.stringify({ users: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: users } = await supabase
    .from("users")
    .select("id, username, name, avatar_url, role")
    .in("id", userIds);

  // If a viewer is logged in, check which of these users they already follow
  const viewerFollowsSet = new Set<string>();
  if (viewerId) {
    const { data: vf } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", viewerId)
      .in("following_id", userIds);
    (vf ?? []).forEach((r) => viewerFollowsSet.add(r.following_id as string));
  }

  const result = (users ?? []).map((u) => ({
    ...u,
    viewer_follows: viewerFollowsSet.has(u.id as string),
  }));

  return new Response(JSON.stringify({ users: result }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
