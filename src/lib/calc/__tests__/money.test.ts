import { describe, expect, it } from "vitest";
import {
  distributeByWeights,
  distributeEvenly,
  monthlyProvisionForAnnual,
  parseAmountToCents,
  spreadAnnualOverMonths,
} from "../../money";

describe("parseAmountToCents", () => {
  it("gère les virgules et points", () => {
    expect(parseAmountToCents("12,50")).toBe(1250);
    expect(parseAmountToCents("12.5")).toBe(1250);
    expect(parseAmountToCents("1 234,56")).toBe(123456);
    expect(parseAmountToCents("")).toBe(0);
    expect(parseAmountToCents("abc")).toBe(0);
    expect(parseAmountToCents(99.99)).toBe(9999);
  });
});

describe("distributeEvenly", () => {
  it("ne perd aucun centime", () => {
    const parts = distributeEvenly(100, 3);
    expect(parts).toEqual([34, 33, 33]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe("distributeByWeights", () => {
  it("répartit proportionnellement sans perte", () => {
    const parts = distributeByWeights(1000, [3000, 1000]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000);
    expect(parts).toEqual([750, 250]);
  });

  it("répartit également si poids nuls", () => {
    const parts = distributeByWeights(100, [0, 0, 0]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("distribue le reste de façon déterministe", () => {
    const parts = distributeByWeights(100, [1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
    expect(parts).toEqual([34, 33, 33]);
  });
});

describe("provisions annuelles", () => {
  it("budget annuel 1200 € => 100 €/mois", () => {
    const annual = 120000; // centimes
    expect(monthlyProvisionForAnnual(annual, 0)).toBe(10000);
    const spread = spreadAnnualOverMonths(annual);
    expect(spread.every((v) => v === 10000)).toBe(true);
    expect(spread.reduce((a, b) => a + b, 0)).toBe(annual);
  });

  it("budget annuel non divisible par 12 ne perd aucun centime", () => {
    const annual = 100000; // 1000,00 € -> 8333,33...
    const spread = spreadAnnualOverMonths(annual);
    expect(spread.reduce((a, b) => a + b, 0)).toBe(annual);
    // 100000 / 12 = 8333.33 -> 8 mois à 8334, 4 mois à 8333 (somme = 100000)
    const sum = spread.reduce((a, b) => a + b, 0);
    expect(sum).toBe(annual);
    expect(Math.max(...spread) - Math.min(...spread)).toBeLessThanOrEqual(1);
  });
});
