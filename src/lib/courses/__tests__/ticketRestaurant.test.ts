import { describe, expect, it } from "vitest";
import {
  eligibilityForCategory,
  inferCategory,
  inferEligibility,
} from "../ticketRestaurant";

describe("inferCategory", () => {
  it("classe les fruits et légumes", () => {
    expect(inferCategory("Pommes")).toBe("fruits_legumes");
    expect(inferCategory("tomates cerises")).toBe("fruits_legumes");
  });

  it("classe la crèmerie", () => {
    expect(inferCategory("Lait demi-écrémé")).toBe("cremerie");
    expect(inferCategory("yaourts nature")).toBe("cremerie");
  });

  it("classe l'alcool à part des autres boissons", () => {
    expect(inferCategory("Vin rouge")).toBe("alcool");
    expect(inferCategory("bière blonde")).toBe("alcool");
    expect(inferCategory("jus d'orange")).toBe("boissons");
  });

  it("ne confond pas 'thé' et 'thon'", () => {
    expect(inferCategory("thon")).toBe("viande_poisson");
    expect(inferCategory("thé vert")).toBe("boissons");
  });

  it("renvoie 'autre' quand rien ne correspond", () => {
    expect(inferCategory("bidule mystère")).toBe("autre");
  });
});

describe("éligibilité ticket restaurant", () => {
  it("rend les produits alimentaires éligibles", () => {
    expect(inferEligibility("Pain")).toBe("eligible");
    expect(inferEligibility("Poulet rôti")).toBe("eligible");
    expect(inferEligibility("jus de pomme")).toBe("eligible");
  });

  it("exclut l'alcool et le non-alimentaire", () => {
    expect(inferEligibility("Vin rouge")).toBe("ineligible");
    expect(inferEligibility("Liquide vaisselle")).toBe("ineligible");
    expect(inferEligibility("croquettes pour chat")).toBe("ineligible");
  });

  it("laisse 'inconnu' pour les rayons ambigus", () => {
    expect(eligibilityForCategory("bebe")).toBe("unknown");
    expect(inferEligibility("bidule mystère")).toBe("unknown");
  });
});
