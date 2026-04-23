import type { APIRoute } from "astro";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";
import { formatRetryAfter, getClientIp, isRateLimited, logRateLimitHit, retryAfterMs } from "@/lib/rateLimit";

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const ip = getClientIp(request);
  const forgotKey = `forgot:${ip}`;

  if (isRateLimited(forgotKey, 8, 15 * 60 * 1000)) {
    logRateLimitHit("forgot", forgotKey);
    const wait = formatRetryAfter(retryAfterMs(forgotKey));
    return new Response(JSON.stringify({ error: `Too many attempts. Try again in ${wait}.` }), { status: 429 });
  }

  const body = (await request.json()) as { identifier?: string };
  const rawIdentifier = body.identifier?.trim() ?? "";

  if (!rawIdentifier) {
    return new Response(JSON.stringify({ error: "Identifier is required" }), { status: 400 });
  }

  let email = rawIdentifier.toLowerCase();

  // If the user entered a username, resolve it to email first.
  if (!email.includes("@")) {
    const admin = createSupabaseAdminClient();
    const { data: user } = await admin
      .from("users")
      .select("email")
      .eq("username", email)
      .maybeSingle();

    if (!user?.email) {
      // Do not reveal whether a username exists.
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    email = user.email.toLowerCase();
  }

  const supabase = createSupabaseServerClient(cookies, request);
  const redirectTo = `${url.origin}/auth/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    // Keep a generic response in production, but expose diagnostics in dev.
    console.error("[forgot-password] resetPasswordForEmail failed", {
      message: error.message,
      code: error.code,
      status: error.status,
      email,
      redirectTo,
    });

    if (import.meta.env.DEV) {
      return new Response(
        JSON.stringify({ error: error.message, code: error.code ?? null, status: error.status ?? null }),
        { status: 500 }
      );
    }

    // Avoid leaking account existence details in production.
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
