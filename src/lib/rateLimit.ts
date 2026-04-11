/**
 * In-memory rate limiter.
 *
 * ⚠️  Production note:
 *   - Works correctly on a single Node.js instance (dev / single-server deployments).
 *   - On serverless/edge runtimes the Map resets on every cold start → limits don't
 *     accumulate across invocations.
 *   - With multiple instances each has its own store → a client can bypass limits by
 *     hitting different instances.
 *   - Edge case: a user who creates multiple accounts can bypass per-user-id limits.
 *     Mitigation: combine IP + user_id in the key where both are available.
 *   Future improvement: replace with Redis or Supabase KV when scaling.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 s to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

/**
 * Returns `true` when the key has exceeded `limit` calls within `windowMs`.
 * Increments the counter on every non-blocked call.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) return true;

  entry.count += 1;
  return false;
}

/**
 * Returns the milliseconds remaining until the rate-limit window resets for `key`.
 * Returns 0 if the key is not currently tracked or the window has already expired.
 * Call this only after `isRateLimited` returned `true`.
 */
export function retryAfterMs(key: string): number {
  const entry = store.get(key);
  if (!entry) return 0;
  return Math.max(0, entry.resetAt - Date.now());
}

/**
 * Formats a millisecond duration as a human-readable string: "4m 17s", "42s", "1m".
 */
export function formatRetryAfter(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

/**
 * Logs a rate-limit hit to stderr so it can be captured by any log aggregator.
 * Pass `userId` when available for richer abuse tracking.
 */
export function logRateLimitHit(action: string, key: string, userId?: string): void {
  const entry: Record<string, string> = {
    action,
    key,
    ts: new Date().toISOString(),
  };
  if (userId) entry.userId = userId;
  console.warn(`[rate-limit] blocked — ${JSON.stringify(entry)}`);
}

/** Extract client IP from request, preferring forwarded headers. */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
