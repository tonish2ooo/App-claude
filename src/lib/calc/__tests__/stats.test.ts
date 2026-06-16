import { describe, expect, it } from "vitest";
import { computeHouseholdStats } from "../stats";
import { makeBudget, makeExpense } from "./fixtures";

const MONTH = "2026-06";

describe("computeHouseholdStats", () => {
  const budgets = [makeBudget("courses", "monthly", 50000), makeBudget("resto", "monthly", 20000)];
  const expenses = [
    makeExpense("a", { budgetId: "courses", amountCents: 30000, date: "2026-06-03", merchantId: "m1" }),
    makeExpense("b", { budgetId: "courses", amountCents: 10000, date: "2026-06-12", merchantId: "m1" }),
    makeExpense("c", { budgetId: "resto", amountCents: 8000, date: "2026-06-09", merchantId: "m2" }),
    makeExpense("d", { amountCents: 5000, date: "2026-06-20" }), // sans budget
    makeExpense("e", { budgetId: "courses", amountCents: 24000, date: "2026-05-15", merchantId: "m1" }),
  ];

  it("répartit le mois par budget et trie (totaux liés aux budgets)", () => {
    const s = computeHouseholdStats({ budgets, expenses, month: MONTH });
    // spentTotalForMonth ne compte que les dépenses rattachées à un budget.
    expect(s.totalThisMonthCents).toBe(48000);
    expect(s.byBudget).toEqual([
      { budgetId: "courses", spentCents: 40000 },
      { budgetId: "resto", spentCents: 8000 },
    ]);
  });

  it("totaux mensuels sur la période et top enseignes", () => {
    const s = computeHouseholdStats({ budgets, expenses, month: MONTH, monthsBack: 2 });
    expect(s.monthlyTotals).toEqual([
      { month: "2026-05", totalCents: 24000 },
      { month: "2026-06", totalCents: 48000 },
    ]);
    expect(s.topMerchants[0]).toEqual({ merchantId: "m1", totalCents: 64000, count: 3 });
    expect(s.topMerchants[1]).toEqual({ merchantId: "m2", totalCents: 8000, count: 1 });
  });
});
