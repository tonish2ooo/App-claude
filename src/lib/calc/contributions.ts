import { distributeByWeights } from "../money";
import type {
  Budget,
  BudgetSplitRule,
  Cents,
  Month,
  MonthlyIncome,
  UserContribution,
  UserProfile,
} from "../types";
import { getMonthlyBudgetAmount } from "./budget";
import { userIncomeTotalCents } from "./income";

/**
 * Répartit un montant (centimes) entre les utilisateurs actifs selon une règle.
 * - prorata : poids = revenu total du mois de chaque utilisateur ;
 * - custom  : poids = pourcentage personnalisé de chaque utilisateur.
 *
 * Aucun centime n'est perdu (distribution déterministe du reste).
 */
export function splitAmount(
  amountCents: Cents,
  rule: BudgetSplitRule,
  activeUsers: UserProfile[],
  incomes: MonthlyIncome[],
  month: Month,
): UserContribution[] {
  if (activeUsers.length === 0) return [];

  let weights: number[];
  if (rule.mode === "custom" && rule.shares && rule.shares.length > 0) {
    const byUser = new Map(rule.shares.map((s) => [s.userId, s.percent]));
    weights = activeUsers.map((u) => byUser.get(u.id) ?? 0);
  } else {
    // Prorata sur les revenus du mois.
    weights = activeUsers.map((u) => userIncomeTotalCents(incomes, u.id, month));
  }

  const amounts = distributeByWeights(amountCents, weights);
  return activeUsers.map((u, i) => ({
    userId: u.id,
    amountCents: amounts[i] ?? 0,
  }));
}

/** Contribution de chaque utilisateur sur un budget pour un mois donné. */
export function budgetContributions(
  budget: Budget,
  activeUsers: UserProfile[],
  incomes: MonthlyIncome[],
  month: Month,
): UserContribution[] {
  const monthly = getMonthlyBudgetAmount(budget, month);
  return splitAmount(monthly, budget.splitRule, activeUsers, incomes, month);
}

/** Contribution totale de chaque utilisateur sur tous les budgets actifs. */
export function totalContributionsByUser(
  budgets: Budget[],
  activeUsers: UserProfile[],
  incomes: MonthlyIncome[],
  month: Month,
): Map<string, Cents> {
  const totals = new Map<string, Cents>();
  for (const user of activeUsers) totals.set(user.id, 0);

  for (const budget of budgets) {
    const contributions = budgetContributions(budget, activeUsers, incomes, month);
    for (const c of contributions) {
      totals.set(c.userId, (totals.get(c.userId) ?? 0) + c.amountCents);
    }
  }
  return totals;
}
