import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/lib/supabase";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createSupabaseServerClient(cookies, request);
  await supabase.auth.signOut();
  return redirect("/auth/login");
};
