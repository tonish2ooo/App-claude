import { describe, expect, it } from "vitest";
import { RECEIPT_CATALOG } from "../receiptCatalog";
import { CATEGORY_LABELS } from "../ticketRestaurant";

function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/s\b/g, "")
    .trim();
}

describe("RECEIPT_CATALOG", () => {
  it("ne contient pas de doublons de noms (clé normalisée)", () => {
    const keys = RECEIPT_CATALOG.map((p) => normalizeName(p.name));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("utilise des rayons et prix valides", () => {
    for (const p of RECEIPT_CATALOG) {
      expect(Object.keys(CATEGORY_LABELS)).toContain(p.category);
      expect(p.priceCents).toBeGreaterThan(0);
      expect(["eligible", "ineligible", "unknown"]).toContain(p.ticketResto);
    }
  });

  it("classe l'alimentaire en éligible et le non-alimentaire en non éligible", () => {
    const food = RECEIPT_CATALOG.find((p) => p.name === "Baguette");
    const nonFood = RECEIPT_CATALOG.find((p) => p.name === "Essuie-tout");
    expect(food?.ticketResto).toBe("eligible");
    expect(nonFood?.ticketResto).toBe("ineligible");
  });
});
