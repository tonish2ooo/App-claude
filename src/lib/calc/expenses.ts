import type { Cents, Expense, Month } from "../types";

/** Une dépense est-elle réalisée (par opposition à planifiée/à venir) ? */
export function isRealized(expense: Expense): boolean {
  return !expense.planned;
}

/** Une dépense appartient-elle au mois donné ? (basé sur la date "YYYY-MM-DD"). */
export function expenseInMonth(expense: Expense, month: Month): boolean {
  return expense.date.slice(0, 7) === month;
}

/** Dépenses du mois. */
export function expensesForMonth(expenses: Expense[], month: Month): Expense[] {
  return expenses.filter((e) => expenseInMonth(e, month));
}

/** Total réel dépensé sur un budget pour un mois (centimes). */
export function spentForBudget(
  expenses: Expense[],
  budgetId: string,
  month: Month,
): Cents {
  return expenses
    .filter((e) => e.budgetId === budgetId && isRealized(e) && expenseInMonth(e, month))
    .reduce((acc, e) => acc + e.amountCents, 0);
}

/** Total réel dépensé du mois, toutes dépenses liées à un budget. */
export function spentTotalForMonth(expenses: Expense[], month: Month): Cents {
  return expenses
    .filter((e) => e.budgetId && isRealized(e) && expenseInMonth(e, month))
    .reduce((acc, e) => acc + e.amountCents, 0);
}

/** Total dépensé depuis le compte commun sur le mois. */
export function spentFromCommonAccount(expenses: Expense[], month: Month): Cents {
  return expenses
    .filter((e) => e.paymentSource === "common_account" && isRealized(e) && expenseInMonth(e, month))
    .reduce((acc, e) => acc + e.amountCents, 0);
}

/** Total dépensé en tickets restaurant par un utilisateur sur le mois. */
export function mealVouchersSpentByUser(
  expenses: Expense[],
  userId: string,
  month: Month,
): Cents {
  return expenses
    .filter(
      (e) =>
        e.paymentSource === "meal_voucher" &&
        isRealized(e) &&
        (e.mealVoucherUserId ?? e.userId) === userId &&
        expenseInMonth(e, month),
    )
    .reduce((acc, e) => acc + e.amountCents, 0);
}
