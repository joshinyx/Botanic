import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireDashboardAuth } from "@/lib/auth";
import { logAction } from "@/lib/log";

// POST — approve or reject
export const POST: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role === "reader") return new Response(JSON.stringify({ error: "Insufficient role" }), { status: 403 });

  const id = params.id;
  if (!id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const body = await request.json() as { action: "approve" | "reject" };
  const { action } = body;

  if (action !== "approve" && action !== "reject") {
    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });
  }

  const status = action === "approve" ? "approved" : "rejected";
  const supabase = createSupabaseServerClient(cookies, request);

  const { error } = await supabase.from("plants").update({ status }).eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  await logAction(supabase, staff.id, action, "plant", id);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
