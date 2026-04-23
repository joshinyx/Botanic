import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireDashboardAuth } from "@/lib/auth";
import { logAction } from "@/lib/log";

// PUT — change a user's role (super_admin only)
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role !== "super_admin") return new Response(JSON.stringify({ error: "Super admin only" }), { status: 403 });

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (id === staff.id) return new Response(JSON.stringify({ error: "Use Supabase to manage your own role" }), { status: 400 });

  const body = await request.json() as { role: string };
  const { role } = body;

  if (!["super_admin", "editor", "reader"].includes(role)) {
    return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400 });
  }

  const supabase = createSupabaseServerClient(cookies, request);
  const { error } = await supabase.from("users").update({ role }).eq("id", id);
  if (error) {
    if (error.message.includes("last super_admin")) {
      return new Response(JSON.stringify({ error: "Cannot remove the last super_admin" }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  await logAction(supabase, staff.id, "change_role", "user", id, { role });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

// PATCH — toggle show_staff_badge (super_admin only, can update self)
export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role !== "super_admin") return new Response(JSON.stringify({ error: "Super admin only" }), { status: 403 });

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const body = await request.json() as { show_staff_badge: boolean };
  if (typeof body.show_staff_badge !== "boolean") {
    return new Response(JSON.stringify({ error: "Invalid value" }), { status: 400 });
  }

  const supabase = createSupabaseServerClient(cookies, request);
  const { error } = await supabase.from("users").update({ show_staff_badge: body.show_staff_badge }).eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

// DELETE — revoke dashboard access (set role to null)
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role !== "super_admin") return new Response(JSON.stringify({ error: "Super admin only" }), { status: 403 });

  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  if (id === staff.id) return new Response(JSON.stringify({ error: "Cannot revoke your own access" }), { status: 400 });

  const supabase = createSupabaseServerClient(cookies, request);
  const { error } = await supabase.from("users").update({ role: null }).eq("id", id);
  if (error) {
    if (error.message.includes("last super_admin")) {
      return new Response(JSON.stringify({ error: "Cannot remove the last super_admin" }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  await logAction(supabase, staff.id, "revoke_role", "user", id);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
