import type { Cents } from "./types";

/** Formate un montant en centimes vers une chaîne € (ex : 12345 -> "123,45 €"). */
export function formatCents(
  cents: Cents,
  options: { withSymbol?: boolean; currency?: string } = {},
): string {
  const { withSymbol = true, currency = "EUR" } = options;
  const value = cents / 100;
  return new Intl.NumberFormat("fr-FR", {
    style: withSymbol ? "currency" : "decimal",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Convertit une saisie utilisateur ("12,50", "12.5", "1 234,56") en centimes.
 * Renvoie 0 pour une saisie vide ou invalide.
 */
export function parseAmountToCents(input: string | number): Cents {
  if (typeof input === "number") {
    return Math.round(input * 100);
  }
  const normalized = input
    .trim()
    .replace(/\s/g, "")
    .replace(/ /g, "")
    .replace(",", ".");
  if (normalized === "") return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

/** Saisie d'édition d'un montant en centimes vers une valeur de champ ("12.50"). */
export function centsToInput(cents: Cents): string {
  return (cents / 100).toFixed(2);
}

/**
 * Répartit un montant total (centimes) selon des poids, sans perdre de centime.
 * Les centimes restants (dûs aux arrondis) sont attribués aux plus grandes
 * parts fractionnaires, de façon déterministe.
 *
 * @returns un tableau de centimes de même longueur que `weights`, dont la somme
 *          vaut exactement `totalCents`.
 */
export function distributeByWeights(totalCents: Cents, weights: number[]): Cents[] {
  const n = weights.length;
  if (n === 0) return [];
  const totalWeight = weights.reduce((acc, w) => acc + (w > 0 ? w : 0), 0);

  // Aucun poids exploitable : répartition égale.
  if (totalWeight <= 0) {
    return distributeEvenly(totalCents, n);
  }

  const exact = weights.map((w) => ((w > 0 ? w : 0) / totalWeight) * totalCents);
  const floored = exact.map((v) => Math.floor(v));
  let remainder = totalCents - floored.reduce((a, b) => a + b, 0);

  // Indices triés par plus grande partie fractionnaire (départage par index).
  const order = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => (b.frac - a.frac) || a.i - b.i);

  const result = [...floored];
  let k = 0;
  while (remainder > 0 && k < order.length) {
    const entry = order[k];
    if (entry) result[entry.i] = (result[entry.i] ?? 0) + 1;
    remainder -= 1;
    k += 1;
  }
  return result;
}

/** Répartit un montant en parts égales sans perdre de centime. */
export function distributeEvenly(totalCents: Cents, parts: number): Cents[] {
  if (parts <= 0) return [];
  const base = Math.floor(totalCents / parts);
  let remainder = totalCents - base * parts;
  const result: Cents[] = [];
  for (let i = 0; i < parts; i += 1) {
    result.push(base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder -= 1;
  }
  return result;
}

/**
 * Répartit un montant annuel sur 12 mois sans perdre de centime sur l'année.
 * @returns un tableau de 12 entrées (centimes) dont la somme vaut le montant annuel.
 */
export function spreadAnnualOverMonths(annualCents: Cents): Cents[] {
  return distributeEvenly(annualCents, 12);
}

/** Provision mensuelle d'un budget annuel : part du mois `monthIndex` (0..11). */
export function monthlyProvisionForAnnual(annualCents: Cents, monthIndex = 0): Cents {
  const spread = spreadAnnualOverMonths(annualCents);
  const idx = ((monthIndex % 12) + 12) % 12;
  return spread[idx] ?? 0;
}
