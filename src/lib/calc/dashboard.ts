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
}): MonthlyDashboardSummary {
  const { household, users, budgets, incomes, expenses, month } = params;
  const activeUsers = users.filter((u) => u.active);

  const budgetTotalCents = budgetTotalForMonth(budgets, month);
  const spentTotalCents = spentTotalForMonth(expenses, month);
  const remainingBudgetCents = budgetTotalCents - spentTotalCents;

  const commonSpent = spentFromCommonAccount(expenses, month);
  const manualBalance = household.manualCommonBalanceCents ?? 0;
  const commonBalanceCents = manualBalance - commonSpent;
  const commonBalanceStatus: MonthlyDashboardSummary["commonBalanceStatus"] =
    household.mode === "bank" ? "synced" : commonSpent > 0 ? "estimated" : "manual";

  return {
    month,
    householdId: household.id,
    budgetTotalCents,
    spentTotalCents,
    remainingBudgetCents,
    commonBalanceCents,
    commonBalanceStatus,
    contributions: contributionSummaries(budgets, activeUsers, incomes, expenses, month),
    budgetProgress: budgetProgressForMonth(budgets, expenses, month),
    mealVoucherBalances: mealVoucherBalances(activeUsers, incomes, expenses, month),
    missingIncomeUserIds: usersMissingIncome(incomes, activeUsers, month),
    incomeComplete: isMonthIncomeComplete(incomes, activeUsers, month),
  };
}
