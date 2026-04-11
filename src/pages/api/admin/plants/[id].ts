import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { requireDashboardAuth } from "@/lib/auth";
import { logAction } from "@/lib/log";
import { isValidHttpUrl } from "@/lib/validate";
import type { Climate, Duration } from "@/types";

const VALID_CLIMATES: Climate[] = ["tropical", "arid", "temperate", "continental", "polar", "mediterranean"];
const VALID_DURATIONS: Duration[] = ["annual", "biennial", "perennial"];
const VALID_TAGS = ["medicinal","edible","ornamental","succulent","aquatic","climbing","shrub","tree","herb","fern","cactus","grass"];

// PUT — edit plant
export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role === "reader") return new Response(JSON.stringify({ error: "Insufficient role" }), { status: 403 });

  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const supabase = createSupabaseServerClient(cookies, request);
  const body = await request.json() as {
    name?: string;
    description?: string;
    origin_country?: string;
    climate?: string;
    duration?: string;
    tags?: string[];
    image_url?: string;
  };

  const updates: Record<string, unknown> = {};

  if (body.name?.trim()) {
    if (body.name.trim().length > 120)
      return new Response(JSON.stringify({ error: "Name must be at most 120 characters" }), { status: 400 });
    updates.name = body.name.trim();
  }
  if (body.description?.trim()) {
    if (body.description.trim().length > 2000)
      return new Response(JSON.stringify({ error: "Description must be at most 2000 characters" }), { status: 400 });
    updates.description = body.description.trim();
  }
  if (body.origin_country?.trim()) {
    if (body.origin_country.trim().length > 100)
      return new Response(JSON.stringify({ error: "Country must be at most 100 characters" }), { status: 400 });
    updates.origin_country = body.origin_country.trim();
  }
  if (body.image_url?.trim()) {
    const url = body.image_url.trim();
    if (!isValidHttpUrl(url))
      return new Response(JSON.stringify({ error: "Image URL must be a valid http/https URL" }), { status: 400 });
    updates.image_url = url;
  }
  if (body.climate !== undefined) {
    if (!VALID_CLIMATES.includes(body.climate as Climate))
      return new Response(JSON.stringify({ error: "Invalid climate" }), { status: 400 });
    updates.climate = body.climate;
  }
  if (body.duration !== undefined) {
    if (!VALID_DURATIONS.includes(body.duration as Duration))
      return new Response(JSON.stringify({ error: "Invalid duration" }), { status: 400 });
    updates.duration = body.duration;
  }
  if (Array.isArray(body.tags))    updates.tags = body.tags.filter((t): t is string => typeof t === "string" && VALID_TAGS.includes(t));

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: "No valid fields to update" }), { status: 400 });
  }

  const { error } = await supabase.from("plants").update(updates).eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  await logAction(supabase, staff.id, "edit", "plant", id, updates);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};

// DELETE — delete plant
export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const staff = await requireDashboardAuth(cookies, request);
  if (!staff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  if (staff.role === "reader") return new Response(JSON.stringify({ error: "Insufficient role" }), { status: 403 });

  const id = params.id;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

  const supabase = createSupabaseServerClient(cookies, request);

  // Verify plant exists before deleting
  const { data: existing } = await supabase.from("plants").select("id").eq("id", id).maybeSingle();
  if (!existing) return new Response(JSON.stringify({ error: "Plant not found" }), { status: 404 });

  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  await logAction(supabase, staff.id, "delete", "plant", id);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
