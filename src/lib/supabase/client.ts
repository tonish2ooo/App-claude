import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null = null;

/** Supabase est-il configuré (variables d'environnement présentes) ? */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Client Supabase navigateur (singleton), ou `null` si non configuré.
 * Tant que Supabase n'est pas configuré, l'application fonctionne en
 * localStorage : aucun appel réseau n'est tenté.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!cached) {
    cached = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return cached;
}
