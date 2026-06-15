import { describe, expect, it } from "vitest";
import { parseVoiceTranscript } from "../voiceParser";

describe("parseVoiceTranscript", () => {
  it("sépare plusieurs articles reliés par 'et' et des virgules", () => {
    const result = parseVoiceTranscript("des pommes, du lait et du pain");
    expect(result.map((r) => r.label)).toEqual(["Pommes", "Lait", "Pain"]);
    expect(result.every((r) => r.quantity === 1)).toBe(true);
  });

  it("extrait une quantité numérique en tête", () => {
    const [item] = parseVoiceTranscript("3 baguettes");
    expect(item).toEqual({ label: "Baguettes", quantity: 3 });
  });

  it("comprend les nombres écrits en lettres", () => {
    const [item] = parseVoiceTranscript("deux yaourts");
    expect(item).toEqual({ label: "Yaourts", quantity: 2 });
  });

  it("reconnaît une unité et le 'de' qui suit", () => {
    const [item] = parseVoiceTranscript("deux litres de lait");
    expect(item).toEqual({ label: "Lait", quantity: 2, unit: "L" });
  });

  it("retire les formules d'introduction", () => {
    const result = parseVoiceTranscript("il faut acheter du fromage");
    expect(result).toHaveLength(1);
    expect(result[0]!.label).toBe("Fromage");
  });

  it("met une majuscule et retire la ponctuation finale", () => {
    const [item] = parseVoiceTranscript("tomates.");
    expect(item!.label).toBe("Tomates");
  });

  it("renvoie une liste vide pour une dictée vide", () => {
    expect(parseVoiceTranscript("   ")).toEqual([]);
  });

  it("gère un kilo de carottes", () => {
    const [item] = parseVoiceTranscript("un kilo de carottes");
    expect(item).toEqual({ label: "Carottes", quantity: 1, unit: "kg" });
  });
});
