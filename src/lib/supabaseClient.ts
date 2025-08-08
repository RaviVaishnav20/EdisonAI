import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { EdisonSettings } from "./settings";

let cached: { key: string; client: SupabaseClient } | null = null;

export function getSupabaseClient(settings: EdisonSettings): SupabaseClient | null {
  if (!settings.supabaseUrl || !settings.supabaseAnonKey) return null;
  const key = `${settings.supabaseUrl}|${settings.supabaseAnonKey}`;
  if (cached && cached.key === key) return cached.client;
  const client = createClient(settings.supabaseUrl, settings.supabaseAnonKey);
  cached = { key, client };
  return client;
}
