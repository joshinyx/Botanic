import type { APIRoute } from "astro";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase";
import { isRateLimited, logRateLimitHit, retryAfterMs, formatRetryAfter, getClientIp } from "@/lib/rateLimit";

const MAX = { name: 100, email: 254 };

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIp(request);
  const registerKey = `register:${ip}`;
  if (isRateLimited(registerKey, 5, 60 * 60 * 1000)) {
    logRateLimitHit("register", registerKey);
    const wait = formatRetryAfter(retryAfterMs(registerKey));
    return new Response(JSON.stringify({ error: `Too many registration attempts. Try again in ${wait}.` }), { status: 429 });
  }
  const body = await request.json() as {
    name: string;
    username: string;
    email: string;
    password: string;
  };

  const { name, username, email, password } = body;

  if (!name?.trim() || !username || !email?.trim() || !password) {
    return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });
  }

  const nameTrimmed  = name.trim();
  const emailTrimmed = email.trim().toLowerCase();
  const usernameClean = username.toLowerCase().trim();

  // Length limits
  if (nameTrimmed.length > MAX.name)
    return new Response(JSON.stringify({ error: "Name is too long" }), { status: 400 });
  if (emailTrimmed.length > MAX.email)
    return new Response(JSON.stringify({ error: "Email is too long" }), { status: 400 });
  if (password.length < 8)
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), { status: 400 });
  if (password.length > 128)
    return new Response(JSON.stringify({ error: "Password is too long" }), { status: 400 });

  // Username format
  if (!/^(?!.*_{2})[a-z0-9_]{3,30}$/.test(usernameClean)) {
    return new Response(
      JSON.stringify({ error: "Username must be 3–30 characters: letters, numbers, underscores only" }),
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  // Check username availability (race condition handled by DB unique constraint below)
  const { data: existing } = await admin
    .from("users")
    .select("id")
    .eq("username", usernameClean)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: "Username already taken" }), { status: 409 });
  }

  // Create auth user — profile row is created by DB trigger
  const { error: authError } = await admin.auth.admin.createUser({
    email: emailTrimmed,
    password,
    email_confirm: true,
    user_metadata: { name: nameTrimmed, username: usernameClean },
  });

  if (authError) {
    // Catch DB-level unique violations (race condition on username/email)
    const msg = authError.message.toLowerCase();
    if (msg.includes("already registered") || msg.includes("email")) {
      return new Response(JSON.stringify({ error: "Email already in use" }), { status: 409 });
    }
    if (msg.includes("username") || msg.includes("unique")) {
      return new Response(JSON.stringify({ error: "Username already taken" }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: authError.message }), { status: 400 });
  }

  // Sign in to set session cookies
  const supabase = createSupabaseServerClient(cookies, request);
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: emailTrimmed,
    password,
  });

  if (signInError) {
    return new Response(JSON.stringify({ error: signInError.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
