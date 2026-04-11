import type { APIRoute } from "astro";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import { isRateLimited, logRateLimitHit, retryAfterMs, formatRetryAfter, getClientIp } from "@/lib/rateLimit";

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIp(request);
  const loginKey = `login:${ip}`;
  if (isRateLimited(loginKey, 10, 15 * 60 * 1000)) {
    logRateLimitHit("login", loginKey);
    const wait = formatRetryAfter(retryAfterMs(loginKey));
    return new Response(JSON.stringify({ error: `Too many login attempts. Try again in ${wait}.` }), { status: 429 });
  }
  const body = await request.json() as { identifier: string; password: string };
  const { identifier, password } = body;

  if (!identifier || !password) {
    return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
  }

  let email = identifier.trim();

  // If identifier is a username (no @), resolve to email
  if (!email.includes("@")) {
    const admin = createSupabaseAdminClient();
    const { data: user } = await admin
      .from("users")
      .select("email")
      .eq("username", email.toLowerCase())
      .maybeSingle();

    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }
    email = user.email;
  }

  const supabase = createSupabaseServerClient(cookies, request);
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
