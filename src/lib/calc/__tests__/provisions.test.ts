import { describe, expect, it } from "vitest";
import { generateMonthlyAnnualBudgetProvisions } from "../provisions";
import { makeBudget, makeIncome, makeUser } from "./fixtures";

const MONTH = "2026-06";
const u1 = makeUser("u1");
const u2 = makeUser("u2");
const incomes = [
  makeIncome("u1", MONTH, 300000, 0),
  makeIncome("u2", MONTH, 100000, 0),
];

let n = 0;
const makeId = () => `prov_${(n += 1)}`;

describe("generateMonthlyAnnualBudgetProvisions", () => {
  it("crée une provision mensuelle pour un budget annuel", () => {
    const budgets = [makeBudget("car", "annual", 120000)];
    const provisions = generateMonthlyAnnualBudgetProvisions({
      budgets,
      month: MONTH,
      existingProvisions: [],
      activeUsers: [u1, u2],
      incomes,
      makeId,
      now: "2026-06-01T00:00:00.000Z",
    });
    expect(provisions).toHaveLength(1);
    expect(provisions[0]?.amountCents).toBe(10000);
    expect(provisions[0]?.source).toBe("automatic");
    expect(provisions[0]?.kind).toBe("annual_budget_provision");
    expect(provisions[0]?.contributions).toEqual([
      { userId: "u1", amountCents: 7500 },
      { userId: "u2", amountCents: 2500 },
    ]);
  });

  it("est idempotent : pas de doublon si relancé", () => {
    const budgets = [makeBudget("car", "annual", 120000)];
    const first = generateMonthlyAnnualBudgetProvisions({
      budgets,
      month: MONTH,
      existingProvisions: [],
      activeUsers: [u1, u2],
      incomes,
      makeId,
    });
    const second = generateMonthlyAnnualBudgetProvisions({
      budgets,
      month: MONTH,
      existingProvisions: first,
      activeUsers: [u1, u2],
      incomes,
      makeId,
    });
    expect(second).toHaveLength(1);
  });

  it("met à jour la provision si le budget annuel change", () => {
    const budgets = [makeBudget("car", "annual", 120000)];
    const first = generateMonthlyAnnualBudgetProvisions({
      budgets,
      month: MONTH,
      existingProvisions: [],
      activeUsers: [u1, u2],
      incomes,
      makeId,
    });
    const updated = [makeBudget("car", "annual", 240000)];
    const second = generateMonthlyAnnualBudgetProvisions({
      budgets: updated,
      month: MONTH,
      existingProvisions: first,
      activeUsers: [u1, u2],
      incomes,
      makeId,
    });
    expect(second).toHaveLength(1);
    expect(second[0]?.amountCents).toBe(20000);
  });

  it("ne touche pas une provision marquée 'ignored'", () => {
    const budgets = [makeBudget("car", "annual", 120000)];
    const first = generateMonthlyAnnualBudgetProvisions({
      budgets,
      month: MONTH,
      existingProvisions: [],
      activeUsers: [u1, u2],
      incomes,
      makeId,
    });
    const ignored = first.map((p) => ({ ...p, status: "ignored" as const }));
    const updated = [makeBudget("car", "annual", 240000)];
    const second = generateMonthlyAnnualBudgetProvisions({
      budgets: updated,
      month: MONTH,
      existingProvisions: ignored,
      activeUsers: [u1, u2],
      incomes,
      makeId,
    });
    expect(second[0]?.amountCents).toBe(10000);
    expect(second[0]?.status).toBe("ignored");
  });

  it("ignore les budgets non annuels", () => {
    const budgets = [makeBudget("courses", "monthly", 50000)];
    const provisions = generateMonthlyAnnualBudgetProvisions({
      budgets,
      month: MONTH,
      existingProvisions: [],
      activeUsers: [u1, u2],
      incomes,
      makeId,
    });
    expect(provisions).toHaveLength(0);
  });
});
