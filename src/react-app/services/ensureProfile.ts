import { supabase } from "./supabaseClient";
import { ORGANIZATION_ID } from "../../shared/tenant";

export async function ensureProfile(userId: string) {
  return supabase
    .from("profiles")
    .upsert(
      [
        {
          user_id: userId,
          organization_id: ORGANIZATION_ID,
        },
      ],
      { onConflict: "user_id" }
    );
}
