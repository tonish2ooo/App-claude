import type { Budget, Cents, Expense, Month } from "../types";

export interface HouseholdStats {
  months: Month[];
  totalCents: Cents;
  expenseCount: number;
  avgPerMonthCents: Cents;
  avgPerExpenseCents: Cents | null;
  /** Dépenses de la période par budget (budgetId vide = sans budget), triées décroissant. */
  byBudget: Array<{ budgetId: string; spentCents: Cents }>;
  /** Dépenses de la période par personne (payeur), triées décroissant. */
  byUser: Array<{ userId: string; spentCents: Cents }>;
  byPaymentSource: { commonAccountCents: Cents; mealVoucherCents: Cents };
  /** Total des dépenses par mois (chronologique, sur la période). */
  monthlyTotals: Array<{ month: Month; totalCents: Cents }>;
  /** Enseignes les plus dépensières sur la période. */
  topMerchants: Array<{ merchantId: string; totalCents: Cents; count: number }>;
}

export function computeHouseholdStats(params: {
  budgets: Budget[];
  expenses: Expense[];
  months: Month[];
  topMerchantsLimit?: number;
}): HouseholdStats {
  const { expenses, months, topMerchantsLimit = 5 } = params;
  const monthSet = new Set(months);
  const inPeriod = expenses.filter((e) => monthSet.has(e.date.slice(0, 7)));
  // Cohérent avec le reste de l'app : on ne compte que les dépenses rattachées à un budget.
  const budgetLinked = inPeriod.filter((e) => e.budgetId);

  const totalCents = budgetLinked.reduce((acc, e) => acc + e.amountCents, 0);
  const expenseCount = budgetLinked.length;
  const avgPerMonthCents = months.length > 0 ? Math.round(totalCents / months.length) : 0;
  const avgPerExpenseCents = expenseCount > 0 ? Math.round(totalCents / expenseCount) : null;

  const sumBy = (key: (e: Expense) => string) => {
    const map = new Map<string, number>();
    for (const e of budgetLinked) map.set(key(e), (map.get(key(e)) ?? 0) + e.amountCents);
    return map;
  };

  const byBudget = [...sumBy((e) => e.budgetId ?? "").entries()]
    .map(([budgetId, spentCents]) => ({ budgetId, spentCents }))
    .sort((a, b) => b.spentCents - a.spentCents);

  const byUser = [...sumBy((e) => e.userId).entries()]
    .map(([userId, spentCents]) => ({ userId, spentCents }))
    .sort((a, b) => b.spentCents - a.spentCents);

  const commonAccountCents = budgetLinked
    .filter((e) => e.paymentSource === "common_account")
    .reduce((acc, e) => acc + e.amountCents, 0);
  const byPaymentSource = { commonAccountCents, mealVoucherCents: totalCents - commonAccountCents };

  const monthlyTotals = months.map((m) => ({
    month: m,
    totalCents: budgetLinked
      .filter((e) => e.date.slice(0, 7) === m)
      .reduce((acc, e) => acc + e.amountCents, 0),
  }));

  const merchantAgg = new Map<string, { totalCents: Cents; count: number }>();
  for (const e of inPeriod) {
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

  return {
    months,
    totalCents,
    expenseCount,
    avgPerMonthCents,
    avgPerExpenseCents,
    byBudget,
    byUser,
    byPaymentSource,
    monthlyTotals,
    topMerchants,
  };
}
