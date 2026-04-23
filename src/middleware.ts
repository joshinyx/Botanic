import { defineMiddleware } from "astro:middleware";
import { createHash } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase";

// Paths that should never be tracked
const SKIP_PREFIXES = [
  "/api/",
  "/_astro/",
  "/favicon",
  "/images/",
  "/dashboard",
  "/admin",
];

// Rudimentary bot filter — skip obvious crawlers so counts stay clean
const BOT_RE = /bot|crawl|spider|slurp|mediapartners|google|bing|yahoo|baidu|yandex|duckduck/i;

function getClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

function getCountryCode(request: Request, ip: string): string | null {
  // Cloudflare sets this header for free on all plans
  const cf = request.headers.get("cf-ipcountry");
  if (cf && cf !== "XX" && cf !== "T1") return cf.toUpperCase();

  // Other common CDN / proxy headers
  const vercel = request.headers.get("x-vercel-ip-country");
  if (vercel) return vercel.toUpperCase();

  // Local lookup via geoip-lite (sync, in-memory — no network call)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const geoip = require("geoip-lite") as { lookup: (ip: string) => { country: string } | null };
    const geo = geoip.lookup(ip);
    return geo?.country ?? null;
  } catch {
    return null;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // Skip non-page paths
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return next();
  }

  // Skip bots
  const ua = context.request.headers.get("user-agent") ?? "";
  if (BOT_RE.test(ua)) {
    return next();
  }

  const ip = getClientIp(context.request);

  // Build the dedup key: one entry per IP per calendar month
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const visitorHash = createHash("sha256").update(`${ip}:${monthKey}`).digest("hex");

  // Fire-and-forget — never block the response
  (async () => {
    try {
      const admin = createSupabaseAdminClient();
      const countryCode = getCountryCode(context.request, ip);

      // Unique constraint on visitor_hash handles concurrent duplicates atomically
      await admin.from("page_views").upsert(
        { visitor_hash: visitorHash, path: pathname, country_code: countryCode },
        { onConflict: "visitor_hash", ignoreDuplicates: true }
      );
    } catch {
      // Never surface tracking errors to the user
    }
  })();

  return next();
});
