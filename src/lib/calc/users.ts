import type { Budget, Cents, Expense, Month, MonthlyIncome, UserProfile } from "../types";
import { activeBudgets } from "./budget";
import { totalContributionsByUser } from "./contributions";
import { mealVouchersSpentByUser } from "./expenses";
import { incomeSharePct, userIncomeForMonth } from "./income";

export interface UserInsights {
  salaryCents: Cents;
  mealVouchersCents: Cents;
  incomeTotalCents: Cents;
  /** Part du revenu du foyer (0..1). */
  incomeSharePct: number;
  contributionCents: Cents;
  /** Reste personnel = revenu - contribution. */
  pocketMoneyCents: Cents;
  /** Taux d'effort = contribution / revenu (0..1). */
  effortRate: number;
  mealGrantedCents: Cents;
  mealSpentCents: Cents;
  mealRemainingCents: Cents;
  /** Nombre de mois où un revenu a été déclaré. */
  monthsDeclared: number;
  avgIncomeCents: Cents | null;
  /** Dépenses enregistrées par cette personne (toutes périodes). */
  expensesLoggedCount: number;
  expensesLoggedTotalCents: Cents;
  /** Revenu total par mois (chronologique). */
  monthlyIncome: Array<{ month: Month; totalCents: Cents }>;
}

export function computeUserInsights(params: {
  userId: string;
  users: UserProfile[];
  budgets: Budget[];
  incomes: MonthlyIncome[];
  expenses: Expense[];
  month: Month;
}): UserInsights {
  const { userId, users, budgets, incomes, expenses, month } = params;
  const active = users.filter((u) => u.active);

  const income = userIncomeForMonth(incomes, userId, month);
  const salaryCents = income?.salaryCents ?? 0;
  const mealVouchersCents = income?.mealVouchersCents ?? 0;
  const incomeTotalCents = salaryCents + mealVouchersCents;

  const sharePct = incomeSharePct(incomes, active, userId, month);
  const contributionCents = totalContributionsByUser(activeBudgets(budgets), active, incomes, month).get(userId) ?? 0;
  const pocketMoneyCents = incomeTotalCents - contributionCents;
  const effortRate = incomeTotalCents > 0 ? contributionCents / incomeTotalCents : 0;

  const mealGrantedCents = mealVouchersCents;
  const mealSpentCents = mealVouchersSpentByUser(expenses, userId, month);
  const mealRemainingCents = mealGrantedCents - mealSpentCents;

  const userIncomes = incomes.filter((i) => i.userId === userId);
  const monthsDeclared = userIncomes.length;
  const incomeSum = userIncomes.reduce((acc, i) => acc + i.salaryCents + i.mealVouchersCents, 0);
  const avgIncomeCents = monthsDeclared > 0 ? Math.round(incomeSum / monthsDeclared) : null;

  const logged = expenses.filter((e) => e.userId === userId && !e.planned);
  const expensesLoggedCount = logged.length;
  const expensesLoggedTotalCents = logged.reduce((acc, e) => acc + e.amountCents, 0);

  const monthlyIncome = userIncomes
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((i) => ({ month: i.month, totalCents: i.salaryCents + i.mealVouchersCents }));

  return {
    salaryCents,
    mealVouchersCents,
    incomeTotalCents,
    incomeSharePct: sharePct,
    contributionCents,
    pocketMoneyCents,
    effortRate,
    mealGrantedCents,
    mealSpentCents,
    mealRemainingCents,
    monthsDeclared,
    avgIncomeCents,
    expensesLoggedCount,
    expensesLoggedTotalCents,
    monthlyIncome,
  };
}
