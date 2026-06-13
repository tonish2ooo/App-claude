import { describe, expect, it } from "vitest";
import {
  householdIncomeTotalCents,
  incomeSharePct,
  isMonthIncomeComplete,
  userIncomeTotalCents,
  usersMissingIncome,
} from "../income";
import { makeIncome, makeUser } from "./fixtures";

const MONTH = "2026-06";
const u1 = makeUser("u1");
const u2 = makeUser("u2");

describe("calculs de revenus", () => {
  it("revenu total utilisateur = salaire + tickets restaurant", () => {
    const incomes = [makeIncome("u1", MONTH, 250000, 15000)];
    expect(userIncomeTotalCents(incomes, "u1", MONTH)).toBe(265000);
  });

  it("revenu total foyer = somme des utilisateurs actifs", () => {
    const incomes = [
      makeIncome("u1", MONTH, 250000, 15000),
      makeIncome("u2", MONTH, 180000, 12000),
    ];
    expect(householdIncomeTotalCents(incomes, [u1, u2], MONTH)).toBe(457000);
  });

  it("pourcentage d'apport", () => {
    const incomes = [
      makeIncome("u1", MONTH, 300000, 0),
      makeIncome("u2", MONTH, 100000, 0),
    ];
    expect(incomeSharePct(incomes, [u1, u2], "u1", MONTH)).toBeCloseTo(0.75, 5);
    expect(incomeSharePct(incomes, [u1, u2], "u2", MONTH)).toBeCloseTo(0.25, 5);
  });

  it("ne divise jamais par zéro", () => {
    expect(incomeSharePct([], [u1, u2], "u1", MONTH)).toBe(0);
  });

  it("détecte les revenus manquants", () => {
    const incomes = [makeIncome("u1", MONTH, 250000, 0)];
    expect(usersMissingIncome(incomes, [u1, u2], MONTH)).toEqual(["u2"]);
    expect(isMonthIncomeComplete(incomes, [u1, u2], MONTH)).toBe(false);
    expect(isMonthIncomeComplete(incomes, [u1], MONTH)).toBe(true);
  });
});
