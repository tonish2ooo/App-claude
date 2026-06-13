import { describe, expect, it } from "vitest";
import { getMonthlyBudgetAmount } from "../budget";
import { budgetContributions } from "../contributions";
import { makeBudget, makeIncome, makeUser } from "./fixtures";

const MONTH = "2026-06";
const u1 = makeUser("u1");
const u2 = makeUser("u2");

describe("getMonthlyBudgetAmount", () => {
  it("budget mensuel : montant tel quel", () => {
    expect(getMonthlyBudgetAmount(makeBudget("b", "monthly", 50000), MONTH)).toBe(50000);
  });

  it("budget annuel : montant rapporté au mois", () => {
    expect(getMonthlyBudgetAmount(makeBudget("b", "annual", 120000), MONTH)).toBe(10000);
  });

  it("budget épargne : montant mensuel d'épargne", () => {
    expect(getMonthlyBudgetAmount(makeBudget("b", "savings", 20000), MONTH)).toBe(20000);
  });
});

describe("contributions sur budget", () => {
  const incomes = [
    makeIncome("u1", MONTH, 300000, 0),
    makeIncome("u2", MONTH, 100000, 0),
  ];

  it("prorata sur budget mensuel", () => {
    const c = budgetContributions(makeBudget("b", "monthly", 40000), [u1, u2], incomes, MONTH);
    expect(c).toEqual([
      { userId: "u1", amountCents: 30000 },
      { userId: "u2", amountCents: 10000 },
    ]);
  });

  it("prorata sur budget annuel (provision mensuelle)", () => {
    const c = budgetContributions(makeBudget("b", "annual", 120000), [u1, u2], incomes, MONTH);
    // provision mensuelle = 10000, réparti 75/25
    expect(c).toEqual([
      { userId: "u1", amountCents: 7500 },
      { userId: "u2", amountCents: 2500 },
    ]);
  });

  it("prorata sur épargne", () => {
    const c = budgetContributions(makeBudget("b", "savings", 20000), [u1, u2], incomes, MONTH);
    expect(c).toEqual([
      { userId: "u1", amountCents: 15000 },
      { userId: "u2", amountCents: 5000 },
    ]);
  });

  it("pourcentage personnalisé", () => {
    const rule = {
      mode: "custom" as const,
      shares: [
        { userId: "u1", percent: 60 },
        { userId: "u2", percent: 40 },
      ],
    };
    const c = budgetContributions(makeBudget("b", "monthly", 10000, rule), [u1, u2], incomes, MONTH);
    expect(c).toEqual([
      { userId: "u1", amountCents: 6000 },
      { userId: "u2", amountCents: 4000 },
    ]);
  });

  it("contribution sans revenus déclarés ne perd aucun centime", () => {
    const c = budgetContributions(makeBudget("b", "monthly", 10000), [u1, u2], [], MONTH);
    expect(c.reduce((a, b) => a + b.amountCents, 0)).toBe(10000);
  });
});
