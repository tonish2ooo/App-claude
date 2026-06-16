import { describe, expect, it } from "vitest";
import { computeUserInsights } from "../users";
import { makeBudget, makeExpense, makeIncome, makeUser } from "./fixtures";

const MONTH = "2026-06";
const u1 = makeUser("u1");
const u2 = makeUser("u2");

describe("computeUserInsights", () => {
  const incomes = [
    makeIncome("u1", MONTH, 300000, 10000), // 3000 € + 100 € TR
    makeIncome("u2", MONTH, 100000, 20000), // 1000 € + 200 € TR
    makeIncome("u1", "2026-05", 300000, 12000),
  ];
  const budgets = [makeBudget("courses", "monthly", 43000)];
  const expenses = [
    makeExpense("e1", { userId: "u1", amountCents: 5000, budgetId: "courses" }),
    makeExpense("tr", { userId: "u1", paymentSource: "meal_voucher", mealVoucherUserId: "u1", amountCents: 3000 }),
  ];

  it("calcule revenus, part, contribution et taux d'effort", () => {
    const i = computeUserInsights({ userId: "u1", users: [u1, u2], budgets, incomes, expenses, month: MONTH });
    expect(i.incomeTotalCents).toBe(310000);
    expect(i.incomeSharePct).toBeCloseTo(310000 / 430000, 5);
    // Contribution prorata sur 43000 : u1 = 43000 * 310000/430000 = 31000.
    expect(i.contributionCents).toBe(31000);
    expect(i.pocketMoneyCents).toBe(310000 - 31000);
    expect(i.effortRate).toBeCloseTo(31000 / 310000, 5);
    expect(i.mealGrantedCents).toBe(10000);
    expect(i.mealSpentCents).toBe(3000);
    expect(i.mealRemainingCents).toBe(7000);
    expect(i.monthsDeclared).toBe(2);
    expect(i.avgIncomeCents).toBe(Math.round((310000 + 312000) / 2));
    expect(i.expensesLoggedCount).toBe(2);
    expect(i.expensesLoggedTotalCents).toBe(8000);
    expect(i.monthlyIncome).toEqual([
      { month: "2026-05", totalCents: 312000 },
      { month: "2026-06", totalCents: 310000 },
    ]);
  });

  it("gère un utilisateur sans revenu déclaré", () => {
    const i = computeUserInsights({ userId: "u3", users: [u1, u2], budgets, incomes, expenses, month: MONTH });
    expect(i.incomeTotalCents).toBe(0);
    expect(i.avgIncomeCents).toBeNull();
    expect(i.effortRate).toBe(0);
  });
});
