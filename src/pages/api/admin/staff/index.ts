import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireDashboardAuth } from "@/lib/auth";
import { logAction } from "@/lib/log";

// POST — assign a dashboard role to an existing user (super_admin only)
export const POST: APIRoute = async ({ request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role !== "super_admin") return new Response(JSON.stringify({ error: "Super admin only" }), { status: 403 });

  const body = await request.json() as { username: string; role: string };
  const { username, role } = body;

  if (!username?.trim()) return new Response(JSON.stringify({ error: "Username required" }), { status: 400 });
  if (!["super_admin", "editor", "reader"].includes(role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
  }

  const supabase = createSupabaseServerClient(cookies, request);

  // Look up the target user
  const { data: target, error: lookupError } = await supabase
    .from("users")
    .select("id, username, email")
    .eq("username", username.toLowerCase().trim())
    .maybeSingle();

  if (lookupError || !target) {
    return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
  }

  // Prevent assigning a role to yourself (to avoid lock-outs)
  if (target.id === staff.id) {
    return new Response(JSON.stringify({ error: "Use Supabase to manage your own role" }), { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", target.id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  await logAction(supabase, staff.id, "assign_role", "user", target.id, { username: target.username, role });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
