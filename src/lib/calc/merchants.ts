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
