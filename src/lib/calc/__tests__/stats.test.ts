import { describe, expect, it } from "vitest";
import { computeHouseholdStats } from "../stats";
import { makeBudget, makeExpense } from "./fixtures";

describe("computeHouseholdStats", () => {
  const budgets = [makeBudget("courses", "monthly", 50000), makeBudget("resto", "monthly", 20000)];
  const expenses = [
    makeExpense("a", { userId: "u1", budgetId: "courses", amountCents: 30000, date: "2026-06-03", merchantId: "m1" }),
    makeExpense("b", { userId: "u2", budgetId: "courses", amountCents: 10000, date: "2026-06-12", merchantId: "m1" }),
    makeExpense("c", { userId: "u1", budgetId: "resto", amountCents: 8000, date: "2026-06-09", merchantId: "m2", paymentSource: "meal_voucher" }),
    makeExpense("d", { userId: "u1", amountCents: 5000, date: "2026-06-20" }), // sans budget → ignoré
    makeExpense("e", { userId: "u1", budgetId: "courses", amountCents: 24000, date: "2026-05-15", merchantId: "m1" }),
  ];

  it("agrège un mois unique par budget, personne et paiement", () => {
    const s = computeHouseholdStats({ budgets, expenses, months: ["2026-06"] });
    expect(s.totalCents).toBe(48000);
    expect(s.expenseCount).toBe(3);
    expect(s.avgPerExpenseCents).toBe(16000);
    expect(s.byBudget).toEqual([
      { budgetId: "courses", spentCents: 40000 },
      { budgetId: "resto", spentCents: 8000 },
    ]);
    expect(s.byUser).toEqual([
      { userId: "u1", spentCents: 38000 },
      { userId: "u2", spentCents: 10000 },
    ]);
    expect(s.byPaymentSource).toEqual({ commonAccountCents: 40000, mealVoucherCents: 8000 });
  });

  it("agrège une période multi-mois et calcule la moyenne par mois", () => {
    const s = computeHouseholdStats({ budgets, expenses, months: ["2026-05", "2026-06"] });
    expect(s.totalCents).toBe(72000);
    expect(s.avgPerMonthCents).toBe(36000);
    expect(s.monthlyTotals).toEqual([
      { month: "2026-05", totalCents: 24000 },
      { month: "2026-06", totalCents: 48000 },
    ]);
    expect(s.topMerchants[0]).toEqual({ merchantId: "m1", totalCents: 64000, count: 3 });
    expect(s.topMerchants[1]).toEqual({ merchantId: "m2", totalCents: 8000, count: 1 });
  });
});
