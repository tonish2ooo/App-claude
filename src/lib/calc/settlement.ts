import type { Cents, Expense, Month, MonthlyIncome, UserProfile } from "../types";
import { splitAmount } from "./contributions";
import { isRealized } from "./expenses";

export interface SettlementTransfer {
  fromUserId: string;
  toUserId: string;
  amountCents: Cents;
}

export interface SettlementResult {
  /** Par utilisateur : ce qu'il a payé, sa juste part, et le solde (payé - part). */
  net: Array<{ userId: string; paidCents: Cents; shouldPayCents: Cents; netCents: Cents }>;
  /** Virements pour équilibrer (débiteur → créditeur). */
  transfers: SettlementTransfer[];
  totalCommonCents: Cents;
}

/**
 * Règlement de fin de mois : sur les dépenses du compte commun, on compare ce
 * que chacun a payé (expense.userId) à sa juste part (selon la règle de
 * répartition), puis on calcule les virements pour rééquilibrer.
 */
export function computeSettlement(params: {
  expenses: Expense[];
  activeUsers: UserProfile[];
  incomes: MonthlyIncome[];
  month: Month;
}): SettlementResult {
  const { expenses, activeUsers, incomes, month } = params;
  const paid = new Map<string, number>();
  const shouldPay = new Map<string, number>();
  for (const u of activeUsers) {
    paid.set(u.id, 0);
    shouldPay.set(u.id, 0);
  }

  let totalCommonCents = 0;
  const monthCommon = expenses.filter(
    (e) => e.paymentSource === "common_account" && isRealized(e) && e.date.slice(0, 7) === month,
  );
  for (const e of monthCommon) {
    totalCommonCents += e.amountCents;
    paid.set(e.userId, (paid.get(e.userId) ?? 0) + e.amountCents);
    const shares = splitAmount(e.amountCents, e.splitRule, activeUsers, incomes, month);
    for (const s of shares) shouldPay.set(s.userId, (shouldPay.get(s.userId) ?? 0) + s.amountCents);
  }

  const net = activeUsers.map((u) => {
    const p = paid.get(u.id) ?? 0;
    const sp = shouldPay.get(u.id) ?? 0;
    return { userId: u.id, paidCents: p, shouldPayCents: sp, netCents: p - sp };
  });

  // Règlement glouton : les débiteurs (net < 0) remboursent les créditeurs.
  const debtors = net.filter((n) => n.netCents < 0).map((n) => ({ userId: n.userId, amount: -n.netCents }));
  const creditors = net.filter((n) => n.netCents > 0).map((n) => ({ userId: n.userId, amount: n.netCents }));
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let di = 0;
  let ci = 0;
  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di]!;
    const c = creditors[ci]!;
    const amt = Math.min(d.amount, c.amount);
    if (amt > 0) transfers.push({ fromUserId: d.userId, toUserId: c.userId, amountCents: amt });
    d.amount -= amt;
    c.amount -= amt;
    if (d.amount <= 0) di += 1;
    if (c.amount <= 0) ci += 1;
  }

  return { net, transfers, totalCommonCents };
}
