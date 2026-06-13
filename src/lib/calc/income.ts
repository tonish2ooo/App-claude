import type { Cents, Month, MonthlyIncome, UserProfile } from "../types";

/** Revenu total d'une ligne de revenu mensuel (salaire + tickets restaurant). */
export function incomeTotalCents(income: Pick<MonthlyIncome, "salaryCents" | "mealVouchersCents">): Cents {
  return income.salaryCents + income.mealVouchersCents;
}

/** Revenu d'un utilisateur pour un mois donné (0 si non déclaré). */
export function userIncomeForMonth(
  incomes: MonthlyIncome[],
  userId: string,
  month: Month,
): MonthlyIncome | undefined {
  return incomes.find((i) => i.userId === userId && i.month === month);
}

/** Revenu total d'un utilisateur pour un mois (0 si non déclaré). */
export function userIncomeTotalCents(
  incomes: MonthlyIncome[],
  userId: string,
  month: Month,
): Cents {
  const income = userIncomeForMonth(incomes, userId, month);
  return income ? incomeTotalCents(income) : 0;
}

/** Revenu total du foyer pour un mois (somme des utilisateurs actifs déclarés). */
export function householdIncomeTotalCents(
  incomes: MonthlyIncome[],
  activeUsers: UserProfile[],
  month: Month,
): Cents {
  return activeUsers.reduce(
    (acc, user) => acc + userIncomeTotalCents(incomes, user.id, month),
    0,
  );
}

/**
 * Pourcentage d'apport d'un utilisateur au foyer (0..1).
 * Jamais de division par zéro : renvoie 0 si le revenu du foyer est nul.
 */
export function incomeSharePct(
  incomes: MonthlyIncome[],
  activeUsers: UserProfile[],
  userId: string,
  month: Month,
): number {
  const total = householdIncomeTotalCents(incomes, activeUsers, month);
  if (total <= 0) return 0;
  return userIncomeTotalCents(incomes, userId, month) / total;
}

/** Utilisateurs actifs n'ayant pas déclaré leurs revenus pour le mois. */
export function usersMissingIncome(
  incomes: MonthlyIncome[],
  activeUsers: UserProfile[],
  month: Month,
): string[] {
  return activeUsers
    .filter((user) => !userIncomeForMonth(incomes, user.id, month))
    .map((user) => user.id);
}

/** Le mois est-il complet (tous les utilisateurs actifs ont déclaré) ? */
export function isMonthIncomeComplete(
  incomes: MonthlyIncome[],
  activeUsers: UserProfile[],
  month: Month,
): boolean {
  if (activeUsers.length === 0) return false;
  return usersMissingIncome(incomes, activeUsers, month).length === 0;
}
