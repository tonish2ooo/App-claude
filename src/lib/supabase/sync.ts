import { getSupabaseClient } from "./client";
import { migrateState } from "../storage/migrations";
import type { LocalAppState } from "../types";

/** Sauvegarde l'état complet dans le cloud (upsert sur la ligne de l'utilisateur). */
export async function saveRemoteState(
  userId: string,
  state: LocalAppState,
): Promise<{ error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { error: "Supabase non configuré." };
  const { error } = await sb
    .from("app_state")
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

/** Charge l'état cloud de l'utilisateur (migré), ou null s'il n'existe pas encore. */
export async function loadRemoteState(
  userId: string,
): Promise<{ state: LocalAppState | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { state: null, error: "Supabase non configuré." };
  const { data, error } = await sb
    .from("app_state")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return { state: null, error: error.message };
  if (!data) return { state: null, error: null };
  return { state: migrateState(data.state), error: null };
}
