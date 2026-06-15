"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  type Household,
  type ListFilters,
  type ListItem,
  type LocalAppState,
  type Product,
  type ProductCategory,
  type Shopper,
  type TicketRestoEligibility,
} from "@/lib/types";
import {
  buildEmptyState,
  importState as reconcileImport,
  loadState,
  saveState,
} from "@/lib/storage/localState";
import { makeId } from "@/lib/id";
import { inferCategory, eligibilityForCategory } from "@/lib/courses/ticketRestaurant";

/** Normalise un libellé pour comparer/dédupliquer (minuscules, sans accents). */
function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/s\b/g, "") // tolère le pluriel ("pommes" ≈ "pomme")
    .trim();
}

export interface AddItemInput {
  label: string;
  quantity?: number;
  unit?: string;
  note?: string;
  source?: ListItem["source"];
}

interface AppStateApi {
  state: LocalAppState;
  ready: boolean;
  currentShopper: Shopper | null;
  shoppers: Shopper[];

  resetEmpty: () => void;
  loadDemo: () => void;
  importData: (raw: unknown) => boolean;
  exportData: () => LocalAppState;

  updateHousehold: (patch: Partial<Household>) => void;
  completeOnboarding: () => void;
  setCurrentShopper: (id: string | null) => void;

  addShopper: (input: { name: string; emoji?: string; color?: string }) => Shopper;
  updateShopper: (id: string, patch: Partial<Shopper>) => void;
  removeShopper: (id: string) => void;

  addProduct: (input: Partial<Product> & { name: string }) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  /**
   * Importe un lot de fiches produits (ex : catalogue issu de tickets de
   * caisse), sans dupliquer les noms déjà présents. Renvoie le nombre ajouté.
   */
  importCatalog: (
    entries: Array<{
      name: string;
      brand?: string;
      priceCents?: number;
      unit?: string;
      category: ProductCategory;
      ticketResto: TicketRestoEligibility;
    }>,
  ) => number;

  /** Ajoute un article à la liste (depuis la dictée ou la saisie). */
  addItem: (input: AddItemInput) => ListItem;
  /** Ajoute plusieurs articles d'un coup (résultat d'une dictée). */
  addItems: (inputs: AddItemInput[]) => ListItem[];
  /** Ajoute un article directement depuis une fiche produit du catalogue. */
  addItemFromProduct: (productId: string, quantity?: number) => ListItem | null;
  updateItem: (id: string, patch: Partial<ListItem>) => void;
  toggleItem: (id: string) => void;
  removeItem: (id: string) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  setItemEligibility: (id: string, eligibility: TicketRestoEligibility) => void;
  clearChecked: () => void;
  clearAll: () => void;

  setFilters: (patch: Partial<ListFilters>) => void;
}

const AppStateContext = createContext<AppStateApi | null>(null);

const DEFAULT_COLORS = ["#007aff", "#ff2d55", "#34c759", "#ff9500", "#af52de", "#32ade6"];
const DEFAULT_EMOJIS = ["🧑‍🍳", "🛒", "🥑", "🧁", "🐱", "🌿"];

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocalAppState>(() => buildEmptyState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadState() ?? buildEmptyState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const now = () => new Date().toISOString();

  const api = useMemo<AppStateApi>(() => {
    const currentShopper =
      state.shoppers.find((s) => s.id === state.currentShopperId) ?? null;

    /**
     * Retrouve la fiche produit correspondant à un libellé ou en crée une
     * nouvelle (enrichissement automatique de la base de données produits).
     * Renvoie le produit et la liste de produits mise à jour.
     */
    function resolveProduct(
      products: Product[],
      label: string,
      householdId: string,
      timestamp: string,
    ): { product: Product; products: Product[] } {
      const key = normalizeName(label);
      const existing = products.find((p) => normalizeName(p.name) === key);
      if (existing) {
        const bumped = { ...existing, timesAdded: existing.timesAdded + 1, updatedAt: timestamp };
        return {
          product: bumped,
          products: products.map((p) => (p.id === existing.id ? bumped : p)),
        };
      }
      const category = inferCategory(label);
      const created: Product = {
        id: makeId("prod"),
        householdId,
        name: label,
        category,
        ticketResto: eligibilityForCategory(category),
        ticketRestoOverridden: false,
        timesAdded: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      return { product: created, products: [...products, created] };
    }

    function addItemsInternal(prev: LocalAppState, inputs: AddItemInput[]): {
      next: LocalAppState;
      created: ListItem[];
    } {
      let products = prev.products;
      let items = prev.items;
      const created: ListItem[] = [];
      const ts = now();

      for (const input of inputs) {
        const label = input.label.trim();
        if (!label) continue;
        const resolved = resolveProduct(products, label, prev.household.id, ts);
        products = resolved.products;
        const product = resolved.product;

        // Fusionne avec un article non coché déjà présent pour le même produit.
        const dup = items.find((it) => !it.checked && it.productId === product.id);
        if (dup) {
          const merged = {
            ...dup,
            quantity: dup.quantity + (input.quantity ?? 1),
            updatedAt: ts,
          };
          items = items.map((it) => (it.id === dup.id ? merged : it));
          created.push(merged);
          continue;
        }

        const item: ListItem = {
          id: makeId("item"),
          householdId: prev.household.id,
          productId: product.id,
          label: product.name,
          quantity: input.quantity ?? 1,
          unit: input.unit ?? product.unit,
          category: product.category,
          ticketResto: product.ticketResto,
          checked: false,
          note: input.note,
          addedByShopperId: prev.currentShopperId,
          source: input.source ?? "manual",
          createdAt: ts,
          updatedAt: ts,
        };
        items = [...items, item];
        created.push(item);
      }

      return { next: { ...prev, products, items }, created };
    }

    return {
      state,
      ready,
      currentShopper,
      shoppers: state.shoppers,

      resetEmpty: () => setState(buildEmptyState()),
      loadDemo: () => setState(buildDemoState()),
      importData: (raw) => {
        const reconciled = reconcileImport(raw);
        if (!reconciled) return false;
        setState(reconciled);
        return true;
      },
      exportData: () => state,

      updateHousehold: (patch) =>
        setState((prev) => ({
          ...prev,
          household: { ...prev.household, ...patch, updatedAt: now() },
        })),

      completeOnboarding: () =>
        setState((prev) => ({ ...prev, onboardingComplete: true })),

      setCurrentShopper: (id) => setState((prev) => ({ ...prev, currentShopperId: id })),

      addShopper: ({ name, emoji, color }) => {
        const index = state.shoppers.length;
        const created: Shopper = {
          id: makeId("shopper"),
          householdId: state.household.id,
          name: name.trim() || `Membre ${index + 1}`,
          emoji: emoji ?? DEFAULT_EMOJIS[index % DEFAULT_EMOJIS.length]!,
          color: color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]!,
          createdAt: now(),
          updatedAt: now(),
        };
        setState((prev) => ({
          ...prev,
          shoppers: [...prev.shoppers, created],
          currentShopperId: prev.currentShopperId ?? created.id,
        }));
        return created;
      },
      updateShopper: (id, patch) =>
        setState((prev) => ({
          ...prev,
          shoppers: prev.shoppers.map((s) =>
            s.id === id ? { ...s, ...patch, updatedAt: now() } : s,
          ),
        })),
      removeShopper: (id) =>
        setState((prev) => ({
          ...prev,
          shoppers: prev.shoppers.filter((s) => s.id !== id),
          currentShopperId: prev.currentShopperId === id ? null : prev.currentShopperId,
        })),

      addProduct: (input) => {
        const category: ProductCategory = input.category ?? inferCategory(input.name);
        const created: Product = {
          id: makeId("prod"),
          householdId: state.household.id,
          name: input.name.trim(),
          description: input.description,
          category,
          brand: input.brand,
          priceCents: input.priceCents,
          unit: input.unit,
          barcode: input.barcode,
          imageUrl: input.imageUrl,
          ticketResto: input.ticketResto ?? eligibilityForCategory(category),
          ticketRestoOverridden: input.ticketRestoOverridden ?? false,
          timesAdded: input.timesAdded ?? 0,
          createdAt: now(),
          updatedAt: now(),
        };
        setState((prev) => ({ ...prev, products: [...prev.products, created] }));
        return created;
      },
      updateProduct: (id, patch) =>
        setState((prev) => ({
          ...prev,
          products: prev.products.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
          ),
          // Répercute le rayon/éligibilité sur les articles non cochés liés.
          items: prev.items.map((it) =>
            it.productId === id && !it.checked
              ? {
                  ...it,
                  category: patch.category ?? it.category,
                  ticketResto: patch.ticketResto ?? it.ticketResto,
                  updatedAt: now(),
                }
              : it,
          ),
        })),
      removeProduct: (id) =>
        setState((prev) => ({
          ...prev,
          products: prev.products.filter((p) => p.id !== id),
          items: prev.items.map((it) =>
            it.productId === id ? { ...it, productId: undefined } : it,
          ),
        })),

      importCatalog: (entries) => {
        let addedCount = 0;
        setState((prev) => {
          const ts = now();
          const known = new Set(prev.products.map((p) => normalizeName(p.name)));
          const additions: Product[] = [];
          for (const entry of entries) {
            const key = normalizeName(entry.name);
            if (known.has(key)) continue; // déjà en base : on ne duplique pas
            known.add(key);
            additions.push({
              id: makeId("prod"),
              householdId: prev.household.id,
              name: entry.name,
              category: entry.category,
              brand: entry.brand,
              priceCents: entry.priceCents,
              unit: entry.unit,
              // Éligibilité issue du ticket (marqueur "*") : on la fige.
              ticketResto: entry.ticketResto,
              ticketRestoOverridden: true,
              timesAdded: 0,
              createdAt: ts,
              updatedAt: ts,
            });
          }
          addedCount = additions.length;
          return { ...prev, products: [...prev.products, ...additions] };
        });
        return addedCount;
      },

      addItem: (input) => {
        let result!: ListItem;
        setState((prev) => {
          const { next, created } = addItemsInternal(prev, [input]);
          result = created[0]!;
          return next;
        });
        return result;
      },
      addItems: (inputs) => {
        let result: ListItem[] = [];
        setState((prev) => {
          const { next, created } = addItemsInternal(prev, inputs);
          result = created;
          return next;
        });
        return result;
      },
      addItemFromProduct: (productId, quantity = 1) => {
        const product = state.products.find((p) => p.id === productId);
        if (!product) return null;
        let result: ListItem | null = null;
        setState((prev) => {
          const { next, created } = addItemsInternal(prev, [
            { label: product.name, quantity, unit: product.unit, source: "catalog" },
          ]);
          result = created[0] ?? null;
          return next;
        });
        return result;
      },
      updateItem: (id, patch) =>
        setState((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === id ? { ...it, ...patch, updatedAt: now() } : it,
          ),
        })),
      toggleItem: (id) =>
        setState((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === id ? { ...it, checked: !it.checked, updatedAt: now() } : it,
          ),
        })),
      removeItem: (id) =>
        setState((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) })),
      setItemQuantity: (id, quantity) =>
        setState((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === id ? { ...it, quantity: Math.max(1, Math.round(quantity)), updatedAt: now() } : it,
          ),
        })),
      setItemEligibility: (id, eligibility) =>
        setState((prev) => ({
          ...prev,
          items: prev.items.map((it) =>
            it.id === id ? { ...it, ticketResto: eligibility, updatedAt: now() } : it,
          ),
          // L'utilisateur tranche : on fige aussi l'éligibilité de la fiche produit.
          products: prev.products.map((p) => {
            const item = prev.items.find((i) => i.id === id);
            return item && p.id === item.productId
              ? { ...p, ticketResto: eligibility, ticketRestoOverridden: true, updatedAt: now() }
              : p;
          }),
        })),
      clearChecked: () =>
        setState((prev) => ({ ...prev, items: prev.items.filter((it) => !it.checked) })),
      clearAll: () => setState((prev) => ({ ...prev, items: [] })),

      setFilters: (patch) =>
        setState((prev) => ({ ...prev, filters: { ...prev.filters, ...patch } })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready]);

  return <AppStateContext.Provider value={api}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateApi {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState doit être utilisé dans AppStateProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Données de démonstration
// ---------------------------------------------------------------------------

function buildDemoState(): LocalAppState {
  const base = buildEmptyState();
  const ts = new Date().toISOString();
  const hid = base.household.id;

  const shoppers: Shopper[] = [
    { id: makeId("shopper"), householdId: hid, name: "Alex", emoji: "🧑‍🍳", color: "#007aff", createdAt: ts, updatedAt: ts },
    { id: makeId("shopper"), householdId: hid, name: "Sam", emoji: "🥑", color: "#ff2d55", createdAt: ts, updatedAt: ts },
  ];

  const demoLabels: Array<{ label: string; qty?: number; unit?: string; price?: number }> = [
    { label: "Lait demi-écrémé", qty: 2, unit: "L", price: 105 },
    { label: "Pommes", qty: 6, price: 250 },
    { label: "Baguette", qty: 2, price: 110 },
    { label: "Poulet rôti", qty: 1, price: 890 },
    { label: "Vin rouge", qty: 1, price: 750 },
    { label: "Liquide vaisselle", qty: 1, price: 320 },
    { label: "Yaourts nature", qty: 1, unit: "pack", price: 280 },
    { label: "Croquettes chat", qty: 1, price: 1290 },
  ];

  const products: Product[] = [];
  const items: ListItem[] = [];
  demoLabels.forEach((d, i) => {
    const category = inferCategory(d.label);
    const product: Product = {
      id: makeId("prod"),
      householdId: hid,
      name: d.label,
      category,
      priceCents: d.price,
      unit: d.unit,
      ticketResto: eligibilityForCategory(category),
      ticketRestoOverridden: false,
      timesAdded: 1,
      createdAt: ts,
      updatedAt: ts,
    };
    products.push(product);
    items.push({
      id: makeId("item"),
      householdId: hid,
      productId: product.id,
      label: product.name,
      quantity: d.qty ?? 1,
      unit: d.unit,
      category,
      ticketResto: product.ticketResto,
      checked: i >= demoLabels.length - 1,
      addedByShopperId: shoppers[i % shoppers.length]!.id,
      source: "voice",
      createdAt: ts,
      updatedAt: ts,
    });
  });

  return {
    ...base,
    shoppers,
    products,
    items,
    currentShopperId: shoppers[0]!.id,
    onboardingComplete: true,
  };
}
