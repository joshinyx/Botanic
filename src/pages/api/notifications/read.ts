import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// PATCH /api/notifications/read
// Body: { id: string }  — mark one as read
//       { all: true }   — mark all as read
export const PATCH: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json() as { id?: string; all?: boolean };

  if (body.all === true) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (body.id) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", body.id)
      .eq("user_id", user.id); // RLS + ownership double-check
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  return json({ error: "id or all:true is required" }, 400);
};
