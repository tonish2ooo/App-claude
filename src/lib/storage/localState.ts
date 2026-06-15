import { APP_STATE_VERSION, type Household, type LocalAppState, type Product } from "../types";
import { makeId } from "../id";
import { RECEIPT_CATALOG } from "../courses/receiptCatalog";

const STORAGE_KEY = "app-courses:state";

/**
 * Version du catalogue produits. Incrémenter pour re-fusionner de nouveaux
 * produits dans les bases existantes (la fusion ignore les noms déjà présents).
 */
export const CATALOG_VERSION = 1;

/** Clé de comparaison d'un nom de produit (minuscules, sans accent, pluriel toléré). */
function productKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/s\b/g, "")
    .trim();
}

/** Supabase est-il configuré ? (persistance cloud / liste partagée multi-appareils). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Foyer par défaut (liste de courses commune). */
function buildHousehold(): Household {
  const now = new Date().toISOString();
  return {
    id: makeId("household"),
    name: "Notre liste",
    defaultCurrency: "EUR",
    createdAt: now,
    updatedAt: now,
  };
}

/** Fiches produits pré-chargées depuis le catalogue (tickets de caisse). */
function buildCatalogProducts(householdId: string, ts: string): Product[] {
  return RECEIPT_CATALOG.map((entry) => ({
    id: makeId("prod"),
    householdId,
    name: entry.name,
    category: entry.category,
    brand: entry.brand,
    priceCents: entry.priceCents,
    ticketResto: entry.ticketResto,
    ticketRestoOverridden: true,
    timesAdded: 0,
    createdAt: ts,
    updatedAt: ts,
  }));
}

/**
 * Fusionne le catalogue des tickets dans une liste de produits existante :
 * ajoute uniquement les fiches dont le nom n'est pas déjà présent.
 */
function mergeCatalogProducts(existing: Product[], householdId: string, ts: string): Product[] {
  const known = new Set(existing.map((p) => productKey(p.name)));
  const additions = buildCatalogProducts(householdId, ts).filter((p) => !known.has(productKey(p.name)));
  return additions.length > 0 ? [...existing, ...additions] : existing;
}

/** État vierge au premier lancement (base produits pré-chargée). */
export function buildEmptyState(): LocalAppState {
  const household = buildHousehold();
  return {
    version: APP_STATE_VERSION,
    household,
    shoppers: [],
    products: buildCatalogProducts(household.id, household.createdAt),
    items: [],
    filters: { ticketResto: "all", hideChecked: false },
    currentShopperId: null,
    onboardingComplete: false,
    catalogVersion: CATALOG_VERSION,
  };
}

/** Valide et complète un objet chargé pour garantir la forme attendue. */
function reconcile(raw: unknown): LocalAppState | null {
  if (!raw || typeof raw !== "object") return null;
  const partial = raw as Partial<LocalAppState>;
  if (!partial.household) return null;
  const base = buildEmptyState();
  const household = { ...base.household, ...partial.household };

  // Migration unique : si la base n'a jamais reçu cette version du catalogue
  // (état d'une version antérieure), on y fusionne les produits des tickets de
  // caisse, sans dupliquer ceux déjà présents ni écraser les ajouts existants.
  const existingProducts = partial.products ?? [];
  const products =
    (partial.catalogVersion ?? 0) < CATALOG_VERSION
      ? mergeCatalogProducts(existingProducts, household.id, new Date().toISOString())
      : existingProducts;

  return {
    ...base,
    ...partial,
    household,
    filters: { ...base.filters, ...partial.filters },
    shoppers: partial.shoppers ?? [],
    products,
    items: partial.items ?? [],
    version: APP_STATE_VERSION,
    catalogVersion: CATALOG_VERSION,
  };
}

/** Charge l'état depuis localStorage. Renvoie null si absent ou invalide. */
export function loadState(): LocalAppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return reconcile(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Sauvegarde l'état dans localStorage. */
export function saveState(state: LocalAppState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Stockage indisponible (mode privé, quota) : on ignore silencieusement.
  }
}

/** Efface l'état persisté (réinitialisation). */
export function clearState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Importe un état depuis un objet JSON (réconcilié). Renvoie null si invalide. */
export function importState(raw: unknown): LocalAppState | null {
  return reconcile(raw);
}
