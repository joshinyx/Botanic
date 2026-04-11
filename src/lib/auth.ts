import type { AstroCookies } from "astro";
import { createSupabaseServerClient } from "./supabase";
import type { DashboardRole } from "@/types";

export async function getSession(cookies: AstroCookies, request: Request) {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

export async function requireAuth(cookies: AstroCookies, request: Request) {
  return getSession(cookies, request);
}

/** Returns the authenticated user's dashboard access, or null if they have no role. */
export async function requireDashboardAuth(cookies: AstroCookies, request: Request) {
  const supabase = createSupabaseServerClient(cookies, request);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!data?.role) return null;
  return data as { id: string; role: DashboardRole };
}
