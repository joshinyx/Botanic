import type { SupabaseClient } from "@supabase/supabase-js";

export async function logAction(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  await supabase.from("action_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
