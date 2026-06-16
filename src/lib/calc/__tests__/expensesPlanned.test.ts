import { describe, expect, it } from "vitest";
import { spentForBudget, spentTotalForMonth, isRealized } from "../expenses";
import { makeExpense } from "./fixtures";

const MONTH = "2026-06";

describe("dépenses planifiées exclues des dépenses réalisées", () => {
  const expenses = [
    makeExpense("done", { budgetId: "b1", amountCents: 5000, date: "2026-06-03" }),
    makeExpense("planned", { budgetId: "b1", amountCents: 9000, date: "2026-06-25", planned: true }),
  ];

  it("isRealized", () => {
    expect(isRealized(expenses[0]!)).toBe(true);
    expect(isRealized(expenses[1]!)).toBe(false);
  });

  it("spentForBudget ignore les dépenses planifiées", () => {
    expect(spentForBudget(expenses, "b1", MONTH)).toBe(5000);
  });

  it("spentTotalForMonth ignore les dépenses planifiées", () => {
    expect(spentTotalForMonth(expenses, MONTH)).toBe(5000);
  });
});
