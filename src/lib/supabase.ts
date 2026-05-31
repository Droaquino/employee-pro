import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const url = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

export const supabase = createClient<Database>(url || "https://placeholder.supabase.co", key || "placeholder", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
