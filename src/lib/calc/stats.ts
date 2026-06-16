import type { Budget, Cents, Expense, Month } from "../types";
import { spentForBudget, spentTotalForMonth } from "./expenses";
import { previousMonth } from "../date";

export interface HouseholdStats {
  month: Month;
  totalThisMonthCents: Cents;
  /** Dépenses du mois par budget (budgetId vide = sans budget), triées décroissant. */
  byBudget: Array<{ budgetId: string; spentCents: Cents }>;
  /** Total des dépenses par mois (chronologique). */
  monthlyTotals: Array<{ month: Month; totalCents: Cents }>;
  /** Enseignes les plus dépensières (toutes périodes). */
  topMerchants: Array<{ merchantId: string; totalCents: Cents; count: number }>;
}

export function computeHouseholdStats(params: {
  budgets: Budget[];
  expenses: Expense[];
  month: Month;
  monthsBack?: number;
  topMerchantsLimit?: number;
}): HouseholdStats {
  const { budgets, expenses, month, monthsBack = 6, topMerchantsLimit = 5 } = params;

  // Répartition du mois par budget.
  const byBudget: Array<{ budgetId: string; spentCents: Cents }> = [];
  let budgetedTotal = 0;
  for (const b of budgets) {
    const spent = spentForBudget(expenses, b.id, month);
    if (spent > 0) {
      byBudget.push({ budgetId: b.id, spentCents: spent });
      budgetedTotal += spent;
    }
  }
  const totalThisMonthCents = spentTotalForMonth(expenses, month);
  const leftover = totalThisMonthCents - budgetedTotal;
  if (leftover > 0) byBudget.push({ budgetId: "", spentCents: leftover });
  byBudget.sort((a, b) => b.spentCents - a.spentCents);

  // Total par mois sur les N derniers mois (mois courant inclus).
  const months: Month[] = [];
  let m = month;
  for (let i = 0; i < monthsBack; i += 1) {
    months.unshift(m);
    m = previousMonth(m);
  }
  const monthlyTotals = months.map((mth) => ({
    month: mth,
    totalCents: spentTotalForMonth(expenses, mth),
  }));

  // Top enseignes (toutes périodes).
  const merchantAgg = new Map<string, { totalCents: Cents; count: number }>();
  for (const e of expenses) {
    if (!e.merchantId) continue;
    const cur = merchantAgg.get(e.merchantId) ?? { totalCents: 0, count: 0 };
    cur.totalCents += e.amountCents;
    cur.count += 1;
    merchantAgg.set(e.merchantId, cur);
  }
  const topMerchants = [...merchantAgg.entries()]
    .map(([merchantId, v]) => ({ merchantId, ...v }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, topMerchantsLimit);

  return { month, totalThisMonthCents, byBudget, monthlyTotals, topMerchants };
}
