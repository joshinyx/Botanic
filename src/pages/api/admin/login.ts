import type { APIRoute } from "astro";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await request.json() as { email: string; password: string };
  const { email, password } = body;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
  }

  const supabase = createSupabaseServerClient(cookies, request);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  }

  // Verify user is actually staff
  const admin = createSupabaseAdminClient();
  const { data: staff } = await admin
    .from("staff_users")
    .select("id, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!staff) {
    await supabase.auth.signOut();
    return new Response(JSON.stringify({ error: "Access denied" }), { status: 403 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
