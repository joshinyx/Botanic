import type { APIRoute } from "astro";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const GET: APIRoute = async ({ url }) => {
  const username = url.searchParams.get("username")?.toLowerCase().trim() ?? "";

  if (!username) {
    return new Response(JSON.stringify({ available: false, error: "Username required" }), { status: 400 });
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return new Response(JSON.stringify({ available: false, error: "Invalid format" }), { status: 200 });
  }

  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  return new Response(JSON.stringify({ available: !data }), { status: 200 });
};
