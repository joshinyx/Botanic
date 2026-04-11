import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { NotificationItem } from "@/types";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET /api/notifications  — list + unread count
export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  // Fetch latest 20 notifications with actor info
  const { data: notifs, error } = await supabase
    .from("notifications")
    .select("*, actor:users!actor_id(username, name, avatar_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return json({ error: error.message }, 500);

  // Batch-fetch plants to avoid N+1
  const entityIds = (notifs ?? [])
    .map((n) => n.entity_id as string | null)
    .filter((id): id is string => id !== null);

  const plantsMap: Record<string, { name: string; image_url: string }> = {};
  if (entityIds.length > 0) {
    const { data: plants } = await supabase
      .from("plants")
      .select("id, name, image_url")
      .in("id", entityIds);
    for (const p of plants ?? []) plantsMap[p.id] = { name: p.name, image_url: p.image_url };
  }

  const items: NotificationItem[] = (notifs ?? []).map((n) => ({
    ...(n as Omit<typeof n, "actor">),
    actor: (n.actor as { username: string; name: string; avatar_url: string | null } | null) ?? null,
    plant: n.entity_id ? (plantsMap[n.entity_id] ?? null) : null,
  }));

  const unreadCount = items.filter((n) => !n.read).length;

  return json({ items, unreadCount });
};
