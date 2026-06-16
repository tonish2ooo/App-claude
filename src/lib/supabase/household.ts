import { getSupabaseClient } from "./client";
import { migrateState } from "../storage/migrations";
import type { LocalAppState } from "../types";

/** Foyer partagé de l'utilisateur courant (null s'il n'en a pas). */
export async function myHousehold(): Promise<string | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.rpc("my_household");
  if (error) return null;
  return (data as string | null) ?? null;
}

/** Crée un foyer partagé avec l'état courant ; renvoie son identifiant. */
export async function createSharedHousehold(
  state: LocalAppState,
): Promise<{ householdId: string | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { householdId: null, error: "Supabase non configuré." };
  const { data, error } = await sb.rpc("create_household", { initial_state: state });
  return { householdId: (data as string) ?? null, error: error?.message ?? null };
}

/** Génère un code d'invitation pour un foyer. */
export async function createInvite(
  householdId: string,
): Promise<{ code: string | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { code: null, error: "Supabase non configuré." };
  const { data, error } = await sb.rpc("create_invite", { hid: householdId });
  return { code: (data as string) ?? null, error: error?.message ?? null };
}

/** Rejoint un foyer via un code ; renvoie son identifiant. */
export async function joinHousehold(
  code: string,
): Promise<{ householdId: string | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { householdId: null, error: "Supabase non configuré." };
  const { data, error } = await sb.rpc("join_household", { invite_code: code.trim() });
  return { householdId: (data as string) ?? null, error: error?.message ?? null };
}

export async function loadSharedState(
  householdId: string,
): Promise<{ state: LocalAppState | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { state: null, error: "Supabase non configuré." };
  const { data, error } = await sb
    .from("shared_state")
    .select("state")
    .eq("household_id", householdId)
    .maybeSingle();
  if (error) return { state: null, error: error.message };
  if (!data) return { state: null, error: null };
  return { state: migrateState(data.state), error: null };
}

export async function saveSharedState(
  householdId: string,
  state: LocalAppState,
): Promise<{ error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { error: "Supabase non configuré." };
  const { error } = await sb
    .from("shared_state")
    .update({ state, updated_at: new Date().toISOString() })
    .eq("household_id", householdId);
  return { error: error?.message ?? null };
}
