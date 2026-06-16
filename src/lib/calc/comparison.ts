import type { Budget, Cents, Expense, Month } from "../types";
import { activeBudgets } from "./budget";
import { spentForBudget, spentTotalForMonth } from "./expenses";
import { previousMonth } from "../date";

export interface BudgetComparison {
  budgetId: string;
  currentCents: Cents;
  previousCents: Cents;
  deltaCents: Cents;
  /** Variation relative (null si pas de base le mois précédent). */
  deltaPct: number | null;
}

export interface MonthComparison {
  month: Month;
  previous: Month;
  byBudget: BudgetComparison[];
  totalCurrentCents: Cents;
  totalPreviousCents: Cents;
  totalDeltaCents: Cents;
  totalDeltaPct: number | null;
}

function pct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return (current - previous) / previous;
}

/** Compare les dépenses réelles du mois aux dépenses du mois précédent, par budget. */
export function computeMonthComparison(params: {
  budgets: Budget[];
  expenses: Expense[];
  month: Month;
}): MonthComparison {
  const { budgets, expenses, month } = params;
  const prev = previousMonth(month);

  const byBudget: BudgetComparison[] = activeBudgets(budgets)
    .map((b) => {
      const currentCents = spentForBudget(expenses, b.id, month);
      const previousCents = spentForBudget(expenses, b.id, prev);
      return {
        budgetId: b.id,
        currentCents,
        previousCents,
        deltaCents: currentCents - previousCents,
        deltaPct: pct(currentCents, previousCents),
      };
    })
    .filter((c) => c.currentCents > 0 || c.previousCents > 0)
    .sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents));

  const totalCurrentCents = spentTotalForMonth(expenses, month);
  const totalPreviousCents = spentTotalForMonth(expenses, prev);

  return {
    month,
    previous: prev,
    byBudget,
    totalCurrentCents,
    totalPreviousCents,
    totalDeltaCents: totalCurrentCents - totalPreviousCents,
    totalDeltaPct: pct(totalCurrentCents, totalPreviousCents),
  };
}
