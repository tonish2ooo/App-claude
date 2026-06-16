import type { Budget, Cents, Expense, MonthlyProvision } from "../types";
import { isRealized } from "./expenses";

export interface AnnualBudgetRow {
  budgetId: string;
  annualCents: Cents;
  provisionedYtdCents: Cents;
  realYtdCents: Cents;
  /** Écart provisionné − réel (positif = il reste de la provision). */
  gapCents: Cents;
  /** Dépense réelle par mois (index 0 = janvier … 11 = décembre). */
  monthlyReal: Cents[];
}

export interface AnnualOverview {
  year: string;
  rows: AnnualBudgetRow[];
  totalAnnualCents: Cents;
  totalProvisionedCents: Cents;
  totalRealCents: Cents;
}

/** Vue annuelle des budgets annuels : provisionné vs réel et calendrier mensuel. */
export function computeAnnualOverview(params: {
  budgets: Budget[];
  expenses: Expense[];
  provisions: MonthlyProvision[];
  year: string;
}): AnnualOverview {
  const { budgets, expenses, provisions, year } = params;
  const annualBudgets = budgets.filter((b) => b.active && b.type === "annual");

  const rows: AnnualBudgetRow[] = annualBudgets.map((b) => {
    const provisionedYtdCents = provisions
      .filter((p) => p.budgetId === b.id && p.status === "active" && p.month.startsWith(year))
      .reduce((acc, p) => acc + p.amountCents, 0);

    const monthlyReal = new Array<number>(12).fill(0);
    let realYtdCents = 0;
    for (const e of expenses) {
      if (e.budgetId !== b.id || !isRealized(e) || !e.date.startsWith(year)) continue;
      const m = Number(e.date.slice(5, 7)) - 1;
      if (m >= 0 && m < 12) monthlyReal[m] = (monthlyReal[m] ?? 0) + e.amountCents;
      realYtdCents += e.amountCents;
    }

    return {
      budgetId: b.id,
      annualCents: b.amountCents,
      provisionedYtdCents,
      realYtdCents,
      gapCents: provisionedYtdCents - realYtdCents,
      monthlyReal,
    };
  });

  return {
    year,
    rows,
    totalAnnualCents: rows.reduce((a, r) => a + r.annualCents, 0),
    totalProvisionedCents: rows.reduce((a, r) => a + r.provisionedYtdCents, 0),
    totalRealCents: rows.reduce((a, r) => a + r.realYtdCents, 0),
  };
}
