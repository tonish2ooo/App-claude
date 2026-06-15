import { describe, expect, it } from "vitest";
import { importState, buildEmptyState } from "../localState";
import { RECEIPT_CATALOG } from "@/lib/courses/receiptCatalog";

const minimalHousehold = {
  id: "household_test",
  name: "Test",
  defaultCurrency: "EUR",
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

describe("réconciliation & migration du catalogue", () => {
  it("fusionne le catalogue dans un état d'une version antérieure (sans catalogVersion)", () => {
    const legacy = { household: minimalHousehold, products: [], items: [] };
    const state = importState(legacy);
    expect(state).not.toBeNull();
    expect(state!.products.length).toBe(RECEIPT_CATALOG.length);
    expect(state!.catalogVersion).toBeGreaterThanOrEqual(1);
  });

  it("ne duplique pas les produits déjà présents lors de la fusion", () => {
    const legacy = {
      household: minimalHousehold,
      products: [
        {
          id: "p1",
          householdId: minimalHousehold.id,
          name: "Baguette",
          category: "boulangerie",
          ticketResto: "eligible",
          ticketRestoOverridden: false,
          timesAdded: 3,
          createdAt: "x",
          updatedAt: "x",
        },
      ],
    };
    const state = importState(legacy);
    const baguettes = state!.products.filter((p) => p.name === "Baguette");
    expect(baguettes).toHaveLength(1);
    // Le produit existant est préservé (popularité conservée).
    expect(baguettes[0]!.timesAdded).toBe(3);
  });

  it("ne re-fusionne pas si le catalogue est déjà à jour", () => {
    const current = { ...buildEmptyState(), household: minimalHousehold };
    const before = current.products.length;
    const state = importState(current);
    expect(state!.products.length).toBe(before);
  });
});
