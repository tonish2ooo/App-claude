import { APP_STATE_VERSION, type LocalAppState } from "../types";

/**
 * Migre un état persisté vers la version courante du schéma.
 *
 * Historique :
 * - v1 : modèle initial (revenus globaux fixes) — déprécié.
 * - v2 : introduction des budgets typés.
 * - v3 : revenus mensuels, provisions annuelles, enseignes, passkeys.
 *
 * La migration est défensive : tout champ manquant reçoit une valeur par défaut.
 */
export function migrateState(raw: unknown): LocalAppState | null {
  if (!raw || typeof raw !== "object") return null;
  const state = raw as Partial<LocalAppState> & { version?: number };

  let migrated: Partial<LocalAppState> = { ...state };

  // v1/v2 -> v3 : on garantit la présence des collections introduites en v3.
  if ((state.version ?? 1) < 3) {
    migrated = {
      ...migrated,
      incomes: migrated.incomes ?? [],
      provisions: migrated.provisions ?? [],
      merchants: migrated.merchants ?? [],
      passkeys: migrated.passkeys ?? [],
    };
  }

  // v3 -> v4 : abonnements récurrents et objectifs d'épargne.
  if ((state.version ?? 1) < 4) {
    migrated = {
      ...migrated,
      recurringExpenses: migrated.recurringExpenses ?? [],
      materializedRecurring: migrated.materializedRecurring ?? [],
      savingsGoals: migrated.savingsGoals ?? [],
    };
  }

  if (!migrated.household) return null;

  const result: LocalAppState = {
    version: APP_STATE_VERSION,
    household: migrated.household,
    users: migrated.users ?? [],
    incomes: migrated.incomes ?? [],
    budgets: migrated.budgets ?? [],
    provisions: migrated.provisions ?? [],
    merchants: migrated.merchants ?? [],
    expenses: migrated.expenses ?? [],
    recurringExpenses: migrated.recurringExpenses ?? [],
    materializedRecurring: migrated.materializedRecurring ?? [],
    savingsGoals: migrated.savingsGoals ?? [],
    passkeys: migrated.passkeys ?? [],
    onboardingComplete: migrated.onboardingComplete ?? false,
    currentUserId: migrated.currentUserId ?? null,
  };

  return result;
}
