import { createClient } from "@supabase/supabase-js";
import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { CookieOptions } from "@supabase/ssr";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Browser client (for React islands)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client — reads cookies from request headers (required for SSR session detection)
export function createSupabaseServerClient(cookies: AstroCookies, request: Request) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie") ?? "");
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            cookies.set(name, value, options as Parameters<AstroCookies["set"]>[2]);
          } catch {
            // Response already sent — token refresh fires async after the page is
            // committed. Safe to ignore: the refreshed token is stored server-side
            // and the updated cookie will be written on the next request.
          }
        });
      },
    },
  });
}

// Admin client (service role — only for server-side admin routes)
export function createSupabaseAdminClient() {
  const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
