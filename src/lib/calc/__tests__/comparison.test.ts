import { describe, expect, it } from "vitest";
import { computeMonthComparison } from "../comparison";
import { makeBudget, makeExpense } from "./fixtures";

describe("computeMonthComparison", () => {
  const budgets = [makeBudget("courses", "monthly", 50000), makeBudget("resto", "monthly", 20000)];
  const expenses = [
    makeExpense("a", { budgetId: "courses", amountCents: 40000, date: "2026-06-03" }),
    makeExpense("b", { budgetId: "courses", amountCents: 30000, date: "2026-05-10" }),
    makeExpense("c", { budgetId: "resto", amountCents: 10000, date: "2026-06-09" }),
  ];

  it("compare le mois au précédent par budget et au total", () => {
    const c = computeMonthComparison({ budgets, expenses, month: "2026-06" });
    expect(c.previous).toBe("2026-05");
    const courses = c.byBudget.find((x) => x.budgetId === "courses")!;
    expect(courses.currentCents).toBe(40000);
    expect(courses.previousCents).toBe(30000);
    expect(courses.deltaCents).toBe(10000);
    expect(courses.deltaPct).toBeCloseTo(10000 / 30000, 5);

    const resto = c.byBudget.find((x) => x.budgetId === "resto")!;
    expect(resto.previousCents).toBe(0);
    expect(resto.deltaPct).toBeNull(); // pas de base le mois précédent

    expect(c.totalCurrentCents).toBe(50000);
    expect(c.totalPreviousCents).toBe(30000);
    expect(c.totalDeltaCents).toBe(20000);
  });
});
