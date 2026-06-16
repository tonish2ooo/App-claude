import { describe, expect, it } from "vitest";
import { computeMerchantInsights } from "../merchants";
import { makeExpense } from "./fixtures";

describe("computeMerchantInsights", () => {
  const expenses = [
    makeExpense("a", { merchantId: "m1", amountCents: 1000, date: "2026-06-01", budgetId: "b1", paymentSource: "common_account" }),
    makeExpense("b", { merchantId: "m1", amountCents: 3000, date: "2026-06-11", budgetId: "b1", paymentSource: "common_account" }),
    makeExpense("c", { merchantId: "m1", amountCents: 2000, date: "2026-07-01", budgetId: "b2", paymentSource: "meal_voucher" }),
    makeExpense("d", { merchantId: "m2", amountCents: 9999, date: "2026-06-02" }),
  ];

  it("calcule les indicateurs enrichis d'une enseigne", () => {
    const i = computeMerchantInsights("m1", expenses);
    expect(i.expenseCount).toBe(3);
    expect(i.totalAmountCents).toBe(6000);
    expect(i.averageAmountCents).toBe(2000);
    expect(i.minAmountCents).toBe(1000);
    expect(i.maxAmountCents).toBe(3000);
    expect(i.firstDate).toBe("2026-06-01");
    expect(i.lastDate).toBe("2026-07-01");
    expect(i.avgDaysBetween).toBe(15); // 30 jours / (3-1)
    expect(i.monthsActive).toBe(2);
    expect(i.perMonthCents).toBe(3000);
    expect(i.topBudgetId).toBe("b1");
    expect(i.commonAccountCents).toBe(4000);
    expect(i.mealVoucherCents).toBe(2000);
    expect(i.monthly).toEqual([
      { month: "2026-06", amountCents: 4000 },
      { month: "2026-07", amountCents: 2000 },
    ]);
    expect(i.topWeekday).not.toBeNull();
    expect(i.topWeekday).toBeGreaterThanOrEqual(0);
    expect(i.topWeekday).toBeLessThanOrEqual(6);
  });

  it("gère une enseigne sans dépense", () => {
    const i = computeMerchantInsights("inconnu", expenses);
    expect(i.expenseCount).toBe(0);
    expect(i.averageAmountCents).toBeNull();
    expect(i.avgDaysBetween).toBeNull();
    expect(i.topBudgetId).toBeNull();
  });
});
