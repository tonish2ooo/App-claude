import { describe, expect, it } from "vitest";
import { goalProgress } from "../goals";
import type { SavingsGoal } from "../../types";

function makeGoal(overrides: Partial<SavingsGoal> = {}): SavingsGoal {
  return {
    id: "g1",
    householdId: "h1",
    name: "Vacances",
    icon: "plane",
    targetCents: 600000,
    currentCents: 240000,
    targetDate: "2026-12-15",
    createdAt: "t",
    updatedAt: "t",
    ...overrides,
  };
}

describe("goalProgress", () => {
  it("avancement, reste et effort mensuel", () => {
    const p = goalProgress(makeGoal(), "2026-06-15");
    expect(p.pct).toBeCloseTo(0.4, 5);
    expect(p.remainingCents).toBe(360000);
    expect(p.reached).toBe(false);
    expect(p.monthsLeft).not.toBeNull();
    expect(p.monthsLeft!).toBeGreaterThan(0);
    expect(p.perMonthCents).toBe(Math.ceil(360000 / p.monthsLeft!));
  });

  it("objectif atteint", () => {
    const p = goalProgress(makeGoal({ currentCents: 600000 }), "2026-06-15");
    expect(p.reached).toBe(true);
    expect(p.remainingCents).toBe(0);
    expect(p.perMonthCents).toBeNull();
  });

  it("sans échéance : pas d'effort mensuel calculé", () => {
    const p = goalProgress(makeGoal({ targetDate: undefined }), "2026-06-15");
    expect(p.monthsLeft).toBeNull();
    expect(p.perMonthCents).toBeNull();
  });
});
