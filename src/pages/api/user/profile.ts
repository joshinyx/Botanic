import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isValidHttpUrl } from "@/lib/validate";

const ALLOWED_SOCIAL_KEYS = ["twitter", "instagram", "github", "website", "linkedin"] as const;
const MAX = { name: 100, bio: 300, socialUrl: 2048 };

// Required URL prefix per network. website is free-form (no prefix enforced).
const SOCIAL_PREFIXES: Partial<Record<typeof ALLOWED_SOCIAL_KEYS[number], string>> = {
  twitter:   "https://x.com/",
  instagram: "https://www.instagram.com/",
  github:    "https://github.com/",
  linkedin:  "https://www.linkedin.com/in/",
};

export const PUT: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json() as {
    name: string;
    bio: string;
    social_links: Record<string, string>;
  };

  const name = body.name?.trim() ?? "";
  const bio  = body.bio?.trim() ?? "";

  if (!name)
    return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
  if (name.length > MAX.name)
    return new Response(JSON.stringify({ error: `Name must be at most ${MAX.name} characters` }), { status: 400 });
  if (bio.length > MAX.bio)
    return new Response(JSON.stringify({ error: `Bio must be at most ${MAX.bio} characters` }), { status: 400 });

  // Whitelist keys and validate each URL
  const cleanLinks: Record<string, string> = {};
  for (const key of ALLOWED_SOCIAL_KEYS) {
    const val = body.social_links?.[key];
    if (!val || typeof val !== "string") continue;
    const trimmed = val.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX.socialUrl)
      return new Response(JSON.stringify({ error: `${key} URL is too long` }), { status: 400 });
    if (!isValidHttpUrl(trimmed))
      return new Response(JSON.stringify({ error: `${key} must be a valid http/https URL` }), { status: 400 });
    const requiredPrefix = SOCIAL_PREFIXES[key as typeof ALLOWED_SOCIAL_KEYS[number]];
    if (requiredPrefix && !trimmed.startsWith(requiredPrefix))
      return new Response(JSON.stringify({ error: `${key} URL must start with ${requiredPrefix}` }), { status: 400 });
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
