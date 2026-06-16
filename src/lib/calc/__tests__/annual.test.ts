import { describe, expect, it } from "vitest";
import { computeAnnualOverview } from "../annual";
import { makeBudget, makeExpense } from "./fixtures";
import type { MonthlyProvision } from "../../types";

function makeProvision(budgetId: string, month: string, amountCents: number): MonthlyProvision {
  return {
    id: `prov_${budgetId}_${month}`,
    householdId: "house_1",
    budgetId,
    month,
    amountCents,
    label: `Provision ${budgetId}`,
    source: "automatic",
    kind: "annual_budget_provision",
    splitRule: { mode: "prorata" },
    contributions: [],
    status: "active",
    createdAt: "t",
    updatedAt: "t",
  };
}

describe("computeAnnualOverview", () => {
  const budgets = [makeBudget("vacances", "annual", 600000), makeBudget("courses", "monthly", 50000)];
  const provisions = [
    makeProvision("vacances", "2026-01", 50000),
    makeProvision("vacances", "2026-02", 50000),
    makeProvision("vacances", "2025-12", 50000), // autre année → ignorée
  ];
  const expenses = [
    makeExpense("v1", { budgetId: "vacances", amountCents: 80000, date: "2026-07-15" }),
    makeExpense("c1", { budgetId: "courses", amountCents: 40000, date: "2026-06-03" }), // pas annuel
  ];

  it("agrège provisionné et réel par budget annuel sur l'année", () => {
    const a = computeAnnualOverview({ budgets, expenses, provisions, year: "2026" });
    expect(a.rows).toHaveLength(1);
    const v = a.rows[0]!;
    expect(v.budgetId).toBe("vacances");
    expect(v.annualCents).toBe(600000);
    expect(v.provisionedYtdCents).toBe(100000);
    expect(v.realYtdCents).toBe(80000);
    expect(v.gapCents).toBe(20000);
    expect(v.monthlyReal[6]).toBe(80000); // juillet (index 6)
    expect(a.totalProvisionedCents).toBe(100000);
    expect(a.totalRealCents).toBe(80000);
  });
});
