import type { LocalAppState } from "../types";
import { migrateState } from "./migrations";

const STORAGE_KEY = "comptes-couple-app:state";

/** Supabase est-il configuré ? (architecture future). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Charge l'état depuis localStorage (avec migration). Renvoie null si absent. */
export function loadState(): LocalAppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return migrateState(parsed);
  } catch {
    return null;
  }
}

/** Sauvegarde l'état dans localStorage. */
export function saveState(state: LocalAppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (mode privé, quota) : on ignore silencieusement.
  }
}

/** Efface l'état persisté (réinitialisation). */
export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
