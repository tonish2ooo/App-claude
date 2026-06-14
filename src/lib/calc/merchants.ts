import type { Cents, Expense, MerchantStats } from "../types";

/**
 * Statistiques d'une enseigne calculées depuis les dépenses qui lui sont liées :
 * - dernière somme dépensée (dépense la plus récente) ;
 * - moyenne des sommes dépensées ;
 * - nombre de dépenses associées ;
 * - total dépensé.
 */
export function computeMerchantStats(
  merchantId: string,
  expenses: Expense[],
): MerchantStats {
  const linked = expenses
    .filter((e) => e.merchantId === merchantId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  const expenseCount = linked.length;
  const totalAmountCents = linked.reduce((acc, e) => acc + e.amountCents, 0);
  const last = linked[linked.length - 1];
  const lastAmountCents: Cents | null = last ? last.amountCents : null;
  const averageAmountCents: Cents | null =
    expenseCount > 0 ? Math.round(totalAmountCents / expenseCount) : null;

  return {
    merchantId,
    expenseCount,
    lastAmountCents,
    averageAmountCents,
    totalAmountCents,
  };
}

/** Statistiques enrichies pour la fiche enseigne (tableau de bord). */
export interface MerchantInsights {
  expenseCount: number;
  totalAmountCents: Cents;
  averageAmountCents: Cents | null;
  minAmountCents: Cents | null;
  maxAmountCents: Cents | null;
  firstDate: string | null;
  lastDate: string | null;
  /** Intervalle moyen entre deux visites, en jours (null si < 2 visites). */
  avgDaysBetween: number | null;
  /** Nombre de mois distincts avec au moins une dépense. */
  monthsActive: number;
  /** Dépense moyenne par mois actif. */
  perMonthCents: Cents | null;
  /** Budget le plus souvent associé (null si aucun). */
  topBudgetId: string | null;
  /** Total payé depuis le compte commun. */
  commonAccountCents: Cents;
  /** Total payé en tickets restaurant. */
  mealVoucherCents: Cents;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return 0;
  return Math.abs(db - da) / 86_400_000;
}

export function computeMerchantInsights(merchantId: string, expenses: Expense[]): MerchantInsights {
  const linked = expenses
    .filter((e) => e.merchantId === merchantId)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));

  const expenseCount = linked.length;
  const totalAmountCents = linked.reduce((acc, e) => acc + e.amountCents, 0);
  const amounts = linked.map((e) => e.amountCents);
  const firstDate = linked[0]?.date ?? null;
  const lastDate = linked[linked.length - 1]?.date ?? null;

  const months = new Set(linked.map((e) => e.date.slice(0, 7)));
  const monthsActive = months.size;

  const avgDaysBetween =
    expenseCount >= 2 && firstDate && lastDate
      ? daysBetween(firstDate, lastDate) / (expenseCount - 1)
      : null;

  // Budget le plus fréquent.
  const budgetCounts = new Map<string, number>();
  for (const e of linked) {
    if (e.budgetId) budgetCounts.set(e.budgetId, (budgetCounts.get(e.budgetId) ?? 0) + 1);
  }
  let topBudgetId: string | null = null;
  let topCount = 0;
  for (const [bid, c] of budgetCounts) {
    if (c > topCount) {
      topCount = c;
      topBudgetId = bid;
    }
  }

  const commonAccountCents = linked
    .filter((e) => e.paymentSource === "common_account")
    .reduce((acc, e) => acc + e.amountCents, 0);
  const mealVoucherCents = totalAmountCents - commonAccountCents;

  return {
    expenseCount,
    totalAmountCents,
    averageAmountCents: expenseCount > 0 ? Math.round(totalAmountCents / expenseCount) : null,
    minAmountCents: amounts.length > 0 ? Math.min(...amounts) : null,
    maxAmountCents: amounts.length > 0 ? Math.max(...amounts) : null,
    firstDate,
    lastDate,
    avgDaysBetween,
    monthsActive,
    perMonthCents: monthsActive > 0 ? Math.round(totalAmountCents / monthsActive) : null,
    topBudgetId,
    commonAccountCents,
    mealVoucherCents,
  };
}

