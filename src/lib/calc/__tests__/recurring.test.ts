import { describe, expect, it } from "vitest";
import { materializeRecurringForMonth } from "../recurring";
import type { RecurringExpense } from "../../types";

function makeRecurring(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: "rec_1",
    householdId: "h1",
    label: "Internet",
    amountCents: 5000,
    budgetId: "budget_internet",
    userId: "u1",
    paymentSource: "common_account",
    splitRule: { mode: "prorata" },
    dayOfMonth: 5,
    startMonth: "2026-06",
    active: true,
    createdAt: "t",
    updatedAt: "t",
    ...overrides,
  };
}

let n = 0;
const makeId = () => `exp_${(n += 1)}`;

describe("materializeRecurringForMonth", () => {
  it("crée la dépense du mois et trace la clé", () => {
    const r = makeRecurring();
    const out = materializeRecurringForMonth({
      recurrings: [r],
      expenses: [],
      materialized: [],
      month: "2026-06",
      makeId,
    });
    expect(out.expenses).toHaveLength(1);
    expect(out.expenses[0]?.date).toBe("2026-06-05");
    expect(out.expenses[0]?.source).toBe("recurring");
    expect(out.expenses[0]?.recurringId).toBe("rec_1");
    expect(out.materialized).toContain("rec_1:2026-06");
  });

  it("est idempotent (pas de doublon au second passage)", () => {
    const r = makeRecurring();
    const first = materializeRecurringForMonth({ recurrings: [r], expenses: [], materialized: [], month: "2026-06", makeId });
    const second = materializeRecurringForMonth({
      recurrings: [r],
      expenses: first.expenses,
      materialized: first.materialized,
      month: "2026-06",
      makeId,
    });
    expect(second.expenses).toHaveLength(1);
    expect(second.expenses).toBe(first.expenses); // référence inchangée
  });

  it("ignore les récurrences inactives ou antérieures au mois de départ", () => {
    const inactive = materializeRecurringForMonth({
      recurrings: [makeRecurring({ active: false })],
      expenses: [],
      materialized: [],
      month: "2026-06",
      makeId,
    });
    expect(inactive.expenses).toHaveLength(0);

    const before = materializeRecurringForMonth({
      recurrings: [makeRecurring({ startMonth: "2026-07" })],
      expenses: [],
      materialized: [],
      month: "2026-06",
      makeId,
    });
    expect(before.expenses).toHaveLength(0);
  });
});
