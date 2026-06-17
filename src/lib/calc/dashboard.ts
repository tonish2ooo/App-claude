import type {
  Budget,
  BudgetProgress,
  Cents,
  ContributionSummary,
  Expense,
  Household,
  MealVoucherBalance,
  Month,
  MonthlyDashboardSummary,
  MonthlyIncome,
  UserProfile,
} from "../types";
import { activeBudgets, getMonthlyBudgetAmount, progressStatus } from "./budget";
import { totalContributionsByUser } from "./contributions";
import {
  mealVouchersSpentByUser,
  spentForBudget,
  spentFromCommonAccount,
  spentTotalForMonth,
} from "./expenses";
import {
  incomeSharePct,
  isMonthIncomeComplete,
  userIncomeForMonth,
  userIncomeTotalCents,
  usersMissingIncome,
} from "./income";

/** Budget total prévu du mois : mensuels + provisions annuelles + épargne. */
export function budgetTotalForMonth(budgets: Budget[], month: Month): Cents {
  return activeBudgets(budgets).reduce(
    (acc, b) => acc + getMonthlyBudgetAmount(b, month),
    0,
  );
}

/** Progression de chaque budget actif pour le mois. */
export function budgetProgressForMonth(
  budgets: Budget[],
  expenses: Expense[],
  month: Month,
): BudgetProgress[] {
  return activeBudgets(budgets).map((budget) => {
    const plannedMonthlyCents = getMonthlyBudgetAmount(budget, month);
    const spentCents = spentForBudget(expenses, budget.id, month);
    const remainingCents = plannedMonthlyCents - spentCents;
    const progress = plannedMonthlyCents > 0 ? spentCents / plannedMonthlyCents : 0;
    return {
      budgetId: budget.id,
      plannedMonthlyCents,
      spentCents,
      remainingCents,
      progress,
      status: progressStatus(progress),
    };
  });
}

/** Récapitulatif de contribution / reste personnel pour chaque utilisateur actif. */
export function contributionSummaries(
  budgets: Budget[],
  activeUsers: UserProfile[],
  incomes: MonthlyIncome[],
  expenses: Expense[],
  month: Month,
): ContributionSummary[] {
  const contributions = totalContributionsByUser(
    activeBudgets(budgets),
    activeUsers,
    incomes,
    month,
  );

  return activeUsers.map((user) => {
    const income = userIncomeForMonth(incomes, user.id, month);
    const salaryCents = income?.salaryCents ?? 0;
    const mealVouchersCents = income?.mealVouchersCents ?? 0;
    const incomeTotalCents = userIncomeTotalCents(incomes, user.id, month);
    const sharePct = incomeSharePct(incomes, activeUsers, user.id, month);
    const contributionTotalCents = contributions.get(user.id) ?? 0;

    const remainingTotalCents = incomeTotalCents - contributionTotalCents;

    // Les dépenses en TR consomment la part TR ; la contribution "argent"
    // est financée par le salaire.
    const mealVouchersSpentCents = mealVouchersSpentByUser(expenses, user.id, month);
    const remainingMealVouchersCents = mealVouchersCents - mealVouchersSpentCents;
    const remainingMoneyCents = remainingTotalCents - remainingMealVouchersCents;

    return {
      userId: user.id,
      month,
      incomeTotalCents,
      incomeSharePct: sharePct,
      contributionTotalCents,
      remainingTotalCents,
      remainingMoneyCents,
      remainingMealVouchersCents,
    };
  });
}

/** Solde TR restant par utilisateur pour le mois. */
export function mealVoucherBalances(
  activeUsers: UserProfile[],
  incomes: MonthlyIncome[],
  expenses: Expense[],
  month: Month,
): MealVoucherBalance[] {
  return activeUsers.map((user) => {
    const grantedCents = userIncomeForMonth(incomes, user.id, month)?.mealVouchersCents ?? 0;
    const spentCents = mealVouchersSpentByUser(expenses, user.id, month);
    return {
      userId: user.id,
      month,
      grantedCents,
      spentCents,
      remainingCents: grantedCents - spentCents,
    };
  });
}

/** Assemble le récapitulatif complet du dashboard pour un mois. */
export function buildDashboardSummary(params: {
  household: Household;
  users: UserProfile[];
  budgets: Budget[];
  incomes: MonthlyIncome[];
  expenses: Expense[];
  month: Month;
  /** Solde réel synchronisé du compte commun (centimes), si une banque est liée. */
  syncedCommonBalanceCents?: number | null;
}): MonthlyDashboardSummary {
  const { household, users, budgets, incomes, expenses, month, syncedCommonBalanceCents } = params;
  const activeUsers = users.filter((u) => u.active);

  const budgetTotalCents = budgetTotalForMonth(budgets, month);
  const spentTotalCents = spentTotalForMonth(expenses, month);
  const remainingBudgetCents = budgetTotalCents - spentTotalCents;

  const contributions = contributionSummaries(budgets, activeUsers, incomes, expenses, month);
  const mvBalances = mealVoucherBalances(activeUsers, incomes, expenses, month);

  // Solde du compte commun = total des contributions du mois, dont on retire la
  // part financée par les tickets restaurant, moins ce qui a été dépensé depuis
  // le compte commun sur le mois.
  const contributionsTotalCents = contributions.reduce(
    (acc, c) => acc + c.contributionTotalCents,
    0,
  );
  const mealVouchersGrantedCents = mvBalances.reduce((acc, b) => acc + b.grantedCents, 0);
  const commonSpent = spentFromCommonAccount(expenses, month);
  const commonAccountTotalCents = contributionsTotalCents - mealVouchersGrantedCents;
  // Si une banque est liée et a renvoyé un solde réel, on l'affiche tel quel
  // (« synchro ») ; sinon on retombe sur l'estimation calculée.
  const hasSynced = syncedCommonBalanceCents != null;
  const commonBalanceCents = hasSynced ? syncedCommonBalanceCents : commonAccountTotalCents - commonSpent;
  const commonBalanceStatus: MonthlyDashboardSummary["commonBalanceStatus"] = hasSynced
    ? "synced"
    : "estimated";

  return {
    month,
    householdId: household.id,
    budgetTotalCents,
    spentTotalCents,
    remainingBudgetCents,
    commonBalanceCents,
    commonAccountTotalCents,
    commonBalanceStatus,
    contributions,
    budgetProgress: budgetProgressForMonth(budgets, expenses, month),
    mealVoucherBalances: mvBalances,
    missingIncomeUserIds: usersMissingIncome(incomes, activeUsers, month),
    incomeComplete: isMonthIncomeComplete(incomes, activeUsers, month),
  };
}
