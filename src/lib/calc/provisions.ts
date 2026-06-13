import type {
  Budget,
  Month,
  MonthlyIncome,
  MonthlyProvision,
  UserProfile,
} from "../types";
import { getMonthlyBudgetAmount } from "./budget";
import { splitAmount } from "./contributions";

export interface GenerateProvisionsArgs {
  budgets: Budget[];
  month: Month;
  existingProvisions: MonthlyProvision[];
  /** Utilisateurs actifs (pour calculer les contributions de la provision). */
  activeUsers?: UserProfile[];
  /** Revenus du mois (pour la répartition prorata). */
  incomes?: MonthlyIncome[];
  /** Générateur d'identifiant (injecté pour les tests). */
  makeId?: () => string;
  /** Horodatage (injecté pour les tests). */
  now?: string;
}

let counter = 0;
function defaultMakeId(): string {
  counter += 1;
  return `prov_${Date.now().toString(36)}_${counter}`;
}

/**
 * Génère / met à jour les provisions mensuelles automatiques des budgets annuels
 * actifs pour le mois donné.
 *
 * Idempotent : pour un budget annuel et un mois donnés, il n'existe qu'une seule
 * provision automatique. Relancer la génération ne crée pas de doublon ; si le
 * budget a changé, la provision "active" est mise à jour. Les provisions
 * marquées "ignored" ou "adjusted" par l'utilisateur ne sont pas écrasées.
 *
 * @returns la liste complète des provisions (inchangées + créées/mises à jour).
 */
export function generateMonthlyAnnualBudgetProvisions(
  args: GenerateProvisionsArgs,
): MonthlyProvision[] {
  const {
    budgets,
    month,
    existingProvisions,
    activeUsers = [],
    incomes = [],
    makeId = defaultMakeId,
    now = new Date().toISOString(),
  } = args;

  const result = [...existingProvisions];
  const annualBudgets = budgets.filter((b) => b.active && b.type === "annual");

  for (const budget of annualBudgets) {
    const amountCents = getMonthlyBudgetAmount(budget, month);
    const contributions = splitAmount(
      amountCents,
      budget.splitRule,
      activeUsers,
      incomes,
      month,
    );

    const idx = result.findIndex(
      (p) =>
        p.budgetId === budget.id &&
        p.month === month &&
        p.source === "automatic" &&
        p.kind === "annual_budget_provision",
    );

    if (idx === -1) {
      result.push({
        id: makeId(),
        householdId: budget.householdId,
        budgetId: budget.id,
        month,
        amountCents,
        label: `Provision ${budget.name}`,
        source: "automatic",
        kind: "annual_budget_provision",
        splitRule: budget.splitRule,
        contributions,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      continue;
    }

    const existing = result[idx];
    if (!existing) continue;

    // On ne réécrit pas une provision pilotée manuellement par l'utilisateur.
    if (existing.status !== "active") continue;

    const changed =
      existing.amountCents !== amountCents ||
      existing.label !== `Provision ${budget.name}` ||
      JSON.stringify(existing.splitRule) !== JSON.stringify(budget.splitRule);

    if (changed) {
      result[idx] = {
        ...existing,
        amountCents,
        label: `Provision ${budget.name}`,
        splitRule: budget.splitRule,
        contributions,
        updatedAt: now,
      };
    }
  }

  return result;
}

/** Provisions actives pour un mois donné. */
export function activeProvisionsForMonth(
  provisions: MonthlyProvision[],
  month: Month,
): MonthlyProvision[] {
  return provisions.filter((p) => p.month === month && p.status === "active");
}
