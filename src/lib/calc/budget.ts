import { monthlyProvisionForAnnual } from "../money";
import type { Budget, Cents, Month } from "../types";
import { monthIndex } from "../date";

/**
 * Montant mensuel d'un budget :
 * - monthly : le montant tel quel ;
 * - annual  : montant annuel rapporté au mois (sans perte de centimes sur l'année) ;
 * - savings : le montant d'épargne mensuel tel quel.
 *
 * Pour un budget annuel, `month` permet d'attribuer correctement le centime
 * résiduel des mois concernés.
 */
export function getMonthlyBudgetAmount(budget: Budget, month?: Month): Cents {
  switch (budget.type) {
    case "monthly":
      return budget.amountCents;
    case "savings":
      return budget.amountCents;
    case "annual": {
      const idx = month ? monthIndex(month) : 0;
      return monthlyProvisionForAnnual(budget.amountCents, idx);
    }
    default:
      return budget.amountCents;
  }
}

/** Budgets actifs triés par ordre d'affichage. */
export function activeBudgets(budgets: Budget[]): Budget[] {
  return budgets
    .filter((b) => b.active)
    .slice()
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

/** Statut visuel d'une progression de budget. */
export function progressStatus(progress: number): "normal" | "warning" | "over" {
  if (progress > 1) return "over";
  if (progress >= 0.75) return "warning";
  return "normal";
}
