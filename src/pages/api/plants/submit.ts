import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isValidHttpUrl } from "@/lib/validate";
import { isRateLimited, logRateLimitHit, retryAfterMs, formatRetryAfter } from "@/lib/rateLimit";
import type { Climate, Duration } from "@/types";

const VALID_CLIMATES: Climate[] = ["tropical", "arid", "temperate", "continental", "polar", "mediterranean", "unknown"];
const VALID_DURATIONS: Duration[] = ["annual", "biennial", "perennial", "unknown"];
const VALID_TAGS = ["medicinal","edible","ornamental","succulent","aquatic","climbing","shrub","tree","herb","fern","cactus","grass"];

const MAX = { name: 120, description: 2000, country: 100, imageUrl: 2048 };

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const submitKey = `submit:${user.id}`;
  if (isRateLimited(submitKey, 10, 60 * 60 * 1000)) {
    logRateLimitHit("submit", submitKey, user.id);
    const wait = formatRetryAfter(retryAfterMs(submitKey));
    return new Response(JSON.stringify({ error: `Too many submissions. Try again in ${wait}.` }), { status: 429 });
  }

  const body = await request.json() as {
    name: string;
    description: string;
    origin_country: string;
    climate: string;
    duration: string;
    tags: string[];
    family?: string;
    image_url: string;
    flower_url?: string;
  };

  const name        = body.name?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const country     = body.origin_country?.trim() ?? "";
  const imageUrl    = body.image_url?.trim() ?? "";
  const flowerUrl   = body.flower_url?.trim() || null;
  const family      = body.family?.trim() ?? null;
  const climate  = body.climate?.trim() ?? "";
  const duration = body.duration?.trim() ?? "";

  // Presence
  if (!name || !description || !country || !climate || !duration || !imageUrl || !flowerUrl || !family)
    return new Response(JSON.stringify({ error: "All fields are required" }), { status: 400 });

  // Length limits
  if (name.length > MAX.name)
    return new Response(JSON.stringify({ error: `Name must be at most ${MAX.name} characters` }), { status: 400 });
  if (description.length > MAX.description)
    return new Response(JSON.stringify({ error: `Description must be at most ${MAX.description} characters` }), { status: 400 });
  if (country.length > MAX.country)
    return new Response(JSON.stringify({ error: `Country must be at most ${MAX.country} characters` }), { status: 400 });
  if (imageUrl.length > MAX.imageUrl)
    return new Response(JSON.stringify({ error: "Image URL is too long" }), { status: 400 });
  if (flowerUrl && flowerUrl.length > MAX.imageUrl)
    return new Response(JSON.stringify({ error: "Flower image URL is too long" }), { status: 400 });

  // Enum validation
  if (!VALID_CLIMATES.includes(climate as Climate))
    return new Response(JSON.stringify({ error: "Invalid climate" }), { status: 400 });
  if (!VALID_DURATIONS.includes(duration as Duration))
    return new Response(JSON.stringify({ error: "Invalid duration" }), { status: 400 });

  // URL must be http/https — prevents javascript: or data: URIs
  if (!isValidHttpUrl(imageUrl))
    return new Response(JSON.stringify({ error: "Image URL must be a valid http/https URL" }), { status: 400 });
  if (flowerUrl && !isValidHttpUrl(flowerUrl))
    return new Response(JSON.stringify({ error: "Flower image URL must be a valid http/https URL" }), { status: 400 });

  const cleanTags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string" && VALID_TAGS.includes(t))
    : [];

  const plantData = {
    name,
    description,
    origin_country: country,
    climate: climate as Climate,
    duration: duration as Duration,
    tags: cleanTags,
    family: family || null,
    image_url: imageUrl,
    flower_url: flowerUrl,
    user_id: user.id,
    status: "pending" as const,
  };

  const { data: plant, error } = await supabase
    .from("plants")
    .insert({ ...plantData, original_data: plantData })
    .select("id")
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, id: plant.id }), { status: 201 });
};
