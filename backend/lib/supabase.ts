import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn("[Supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set; using in-memory fallback for auth/credits.");
}

export const supabase =
  url && serviceRoleKey
    ? createClient(url, serviceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
    : null;
