import { APP_STATE_VERSION, type Household, type LocalAppState, type Product } from "../types";
import { makeId } from "../id";
import { RECEIPT_CATALOG } from "../courses/receiptCatalog";

const STORAGE_KEY = "app-courses:state";

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
  };
}

/** Valide et complète un objet chargé pour garantir la forme attendue. */
function reconcile(raw: unknown): LocalAppState | null {
  if (!raw || typeof raw !== "object") return null;
  const partial = raw as Partial<LocalAppState>;
  if (!partial.household) return null;
  const base = buildEmptyState();
  const household = { ...base.household, ...partial.household };
  // Base produits vide (état d'une version antérieure au catalogue) : on la
  // pré-charge depuis les tickets de caisse afin que l'autocomplétion et les
  // suggestions fonctionnent immédiatement.
  const hasProducts = Array.isArray(partial.products) && partial.products.length > 0;
  return {
    ...base,
    ...partial,
    household,
    filters: { ...base.filters, ...partial.filters },
    shoppers: partial.shoppers ?? [],
    products: hasProducts
      ? partial.products!
      : buildCatalogProducts(household.id, new Date().toISOString()),
    items: partial.items ?? [],
    version: APP_STATE_VERSION,
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
