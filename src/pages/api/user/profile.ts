import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isValidHttpUrl } from "@/lib/validate";

const ALLOWED_SOCIAL_KEYS = ["website", "mail", "location"] as const;

type SocialKey = typeof ALLOWED_SOCIAL_KEYS[number];

const MAX = { name: 100, bio: 300, socialUrl: 2048 };

// No URL prefix required — both are free-form.
const SOCIAL_PREFIXES: Partial<Record<SocialKey, string>> = {};

// Keys that are NOT http URLs and require custom validation instead.
const EMAIL_KEYS: Set<SocialKey> = new Set(["mail"]);

// Keys that are free text — no URL or email validation.
const FREE_TEXT_KEYS: Set<SocialKey> = new Set(["location"]);

export const PUT: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json() as {
    name?: string;
    bio: string;
    social_links: Record<string, string>;
  };

  const name = body.name?.trim() ?? "";
  const bio  = body.bio?.trim() ?? "";

  if (name.length > MAX.name)
    return new Response(JSON.stringify({ error: `Name must be at most ${MAX.name} characters` }), { status: 400 });
  if (bio.length > MAX.bio)
    return new Response(JSON.stringify({ error: `Bio must be at most ${MAX.bio} characters` }), { status: 400 });

  // Whitelist keys and validate each value
  const cleanLinks: Record<string, string> = {};
  for (const key of ALLOWED_SOCIAL_KEYS) {
    const val = body.social_links?.[key];
    if (!val || typeof val !== "string") continue;
    const trimmed = val.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX.socialUrl)
      return new Response(JSON.stringify({ error: `${key} is too long` }), { status: 400 });

    if (EMAIL_KEYS.has(key)) {
      // Email: must contain @
      if (!trimmed.includes("@"))
        return new Response(JSON.stringify({ error: `${key} must contain @` }), { status: 400 });
    } else if (!FREE_TEXT_KEYS.has(key)) {
      // URL: must be valid http/https
      if (!isValidHttpUrl(trimmed))
        return new Response(JSON.stringify({ error: `${key} must be a valid http/https URL` }), { status: 400 });
      const requiredPrefix = SOCIAL_PREFIXES[key];
      if (requiredPrefix && !trimmed.startsWith(requiredPrefix))
        return new Response(JSON.stringify({ error: `${key} URL must start with ${requiredPrefix}` }), { status: 400 });
    }
    cleanLinks[key] = trimmed;
  }

  const { error } = await supabase
    .from("users")
    .update({ name, bio: bio || null, social_links: cleanLinks })
    .eq("id", user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
