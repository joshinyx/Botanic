import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireDashboardAuth } from "@/lib/auth";
import { logAction } from "@/lib/log";

// POST — restore plant to original_data snapshot
export const POST: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role === "reader") return new Response(JSON.stringify({ error: "Insufficient role" }), { status: 403 });

  const id = params.id;
  if (!id) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const supabase = createSupabaseServerClient(cookies, request);

  const { data: plant } = await supabase
    .from("plants")
    .select("original_data")
    .eq("id", id)
    .single();

  if (!plant?.original_data) {
    return new Response(JSON.stringify({ error: "No original data to restore" }), { status: 400 });
  }

  const { original_data } = plant;
  const { error } = await supabase.from("plants").update({
    name:           original_data.name,
    description:    original_data.description,
    origin_country: original_data.origin_country,
    climate:        original_data.climate,
    duration:       original_data.duration,
    tags:           original_data.tags,
    image_url:      original_data.image_url,
  }).eq("id", id);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  await logAction(supabase, staff.id, "restore", "plant", id);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
