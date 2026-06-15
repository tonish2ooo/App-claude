import type { CurrencyCode, Expense, Month, RecurringExpense } from "../types";

export interface MaterializeArgs {
  recurrings: RecurringExpense[];
  expenses: Expense[];
  materialized: string[];
  month: Month;
  currency?: CurrencyCode;
  now?: string;
  makeId?: () => string;
}

export interface MaterializeResult {
  expenses: Expense[];
  materialized: string[];
}

let counter = 0;
function defaultMakeId(): string {
  counter += 1;
  return `exp_${Date.now().toString(36)}_${counter}`;
}

/**
 * Matérialise les dépenses récurrentes actives pour un mois donné.
 *
 * Idempotent : chaque couple (récurrence, mois) n'est créé qu'une fois, tracé
 * dans le registre `materialized` (append-only). Supprimer ou modifier une
 * dépense générée ne la recrée donc pas au rafraîchissement.
 */
export function materializeRecurringForMonth(args: MaterializeArgs): MaterializeResult {
  const {
    recurrings,
    expenses,
    materialized,
    month,
    currency = "EUR",
    now = new Date().toISOString(),
    makeId = defaultMakeId,
  } = args;

  const ledger = new Set(materialized);
  const created: Expense[] = [];

  for (const r of recurrings) {
    if (!r.active) continue;
    if (month < r.startMonth) continue;
    const key = `${r.id}:${month}`;
    if (ledger.has(key)) continue;

    const day = Math.min(28, Math.max(1, r.dayOfMonth));
    created.push({
      id: makeId(),
      householdId: r.householdId,
      merchantId: r.merchantId,
      userId: r.userId,
      amountCents: r.amountCents,
      currency,
      paymentSource: r.paymentSource,
      mealVoucherUserId: r.paymentSource === "meal_voucher" ? r.userId : undefined,
      splitRule: r.splitRule,
      date: `${month}-${String(day).padStart(2, "0")}`,
      budgetId: r.budgetId,
      source: "recurring",
      recurringId: r.id,
      createdAt: now,
      updatedAt: now,
    });
    ledger.add(key);
  }

  if (created.length === 0) return { expenses, materialized };
  return { expenses: [...expenses, ...created], materialized: [...ledger] };
}
