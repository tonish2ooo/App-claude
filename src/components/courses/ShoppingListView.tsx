"use client";

import { useMemo } from "react";
import { useAppState } from "@/state/AppStateContext";
import type { ListItem, ProductCategory, TicketRestoFilter } from "@/lib/types";
import {
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  eligibilityLabel,
} from "@/lib/courses/ticketRestaurant";
import { EmptyState, Pill, SectionTitle } from "@/components/ui/primitives";
import { formatCents } from "@/lib/money";

/** Plafond journalier d'utilisation des titres-restaurant (France, 2025). */
const TR_DAILY_CAP_CENTS = 2500;

const CATEGORY_ORDER: ProductCategory[] = [
  "fruits_legumes",
  "boulangerie",
  "cremerie",
  "viande_poisson",
  "epicerie_salee",
  "epicerie_sucree",
  "plats_prepares",
  "surgeles",
  "boissons",
  "alcool",
  "hygiene",
  "entretien",
  "bebe",
  "animaux",
  "maison",
  "autre",
];

const TR_FILTER_OPTIONS: Array<{ value: TicketRestoFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "eligible_only", label: "🎫 Ticket resto" },
  { value: "ineligible_only", label: "Hors TR" },
];

export function ShoppingListView() {
  const {
    state: { items, products, filters, shoppers },
    setFilters,
    toggleItem,
    removeItem,
    setItemQuantity,
    setItemEligibility,
    clearChecked,
  } = useAppState();

  const priceById = useMemo(
    () => new Map(products.map((p) => [p.id, p.priceCents] as const)),
    [products],
  );

  /** Total estimé des articles à acheter (non cochés) et part éligible TR. */
  const totals = useMemo(() => {
    let totalCents = 0;
    let eligibleCents = 0;
    let pricedCount = 0;
    let unpricedCount = 0;
    for (const it of items) {
      if (it.checked) continue;
      const unit = it.productId ? priceById.get(it.productId) : undefined;
      if (unit == null) {
        unpricedCount += 1;
        continue;
      }
      const line = unit * it.quantity;
      totalCents += line;
      pricedCount += 1;
      if (it.ticketResto === "eligible") eligibleCents += line;
    }
    return { totalCents, eligibleCents, pricedCount, unpricedCount };
  }, [items, priceById]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (filters.hideChecked && it.checked) return false;
      if (filters.ticketResto === "eligible_only" && it.ticketResto !== "eligible") return false;
      if (filters.ticketResto === "ineligible_only" && it.ticketResto === "eligible") return false;
      return true;
    });
  }, [items, filters]);

  const grouped = useMemo(() => {
    const map = new Map<ProductCategory, ListItem[]>();
    for (const it of filtered) {
      const list = map.get(it.category) ?? [];
      list.push(it);
      map.set(it.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!.sort((a, b) => Number(a.checked) - Number(b.checked)),
    }));
  }, [filtered]);

  const remaining = items.filter((it) => !it.checked).length;
  const eligibleRemaining = items.filter((it) => !it.checked && it.ticketResto === "eligible").length;
  const checkedCount = items.filter((it) => it.checked).length;

  const shopperById = useMemo(
    () => new Map(shoppers.map((s) => [s.id, s] as const)),
    [shoppers],
  );

  return (
    <div>
      {/* Total estimé du panier + part payable en tickets restaurant */}
      {totals.pricedCount > 0 && (
        <div className="mb-2 rounded-2xl bg-hero p-4 text-white shadow-hero">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[13px] text-white/80">Total estimé à acheter</p>
              <p className="text-2xl font-bold tracking-tight">{formatCents(totals.totalCents)}</p>
            </div>
            <div className="text-right">
              <p className="text-[13px] text-white/80">🎫 Ticket resto</p>
              <p className="text-lg font-semibold">{formatCents(totals.eligibleCents)}</p>
            </div>
          </div>
          <p className="mt-1 text-[11px] text-white/75">
            {totals.eligibleCents > TR_DAILY_CAP_CENTS
              ? `Au-delà du plafond de ${formatCents(TR_DAILY_CAP_CENTS)}/jour en titres-restaurant.`
              : `Payable en titres-restaurant (plafond ${formatCents(TR_DAILY_CAP_CENTS)}/jour).`}
            {totals.unpricedCount > 0 && ` · ${totals.unpricedCount} article(s) sans prix connu.`}
          </p>
        </div>
      )}

      {/* Filtre tickets restaurant */}
      <div className="sticky top-[60px] z-10 -mx-4 mb-2 bg-surface-subtle/95 px-4 py-2 backdrop-blur">
        <div className="flex gap-1 rounded-xl bg-surface-muted p-1">
          {TR_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilters({ ticketResto: opt.value })}
              className={
                "flex-1 rounded-lg px-2 py-2 text-[13px] font-medium transition " +
                (filters.ticketResto === opt.value ? "bg-surface text-ink shadow-sm" : "text-ink-muted")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-xs text-ink-muted">
          <span>
            {remaining} à acheter · {eligibleRemaining} en ticket resto
          </span>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={filters.hideChecked}
              onChange={(e) => setFilters({ hideChecked: e.target.checked })}
              className="h-4 w-4 rounded accent-brand-600"
            />
            Masquer cochés
          </label>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState icon="🛒" title="Liste vide" hint="Dictez vos premières courses avec le micro ci-dessus." />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Aucun article" hint="Aucun article ne correspond au filtre sélectionné." />
      ) : (
        grouped.map(({ category, items: rows }) => (
          <div key={category}>
            <SectionTitle>
              {CATEGORY_EMOJI[category]} {CATEGORY_LABELS[category]}
            </SectionTitle>
            <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
              {rows.map((it, idx) => {
                const shopper = it.addedByShopperId ? shopperById.get(it.addedByShopperId) : null;
                return (
                  <div key={it.id}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleItem(it.id)}
                        aria-label={it.checked ? "Décocher" : "Cocher"}
                        className={
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition " +
                          (it.checked
                            ? "border-ok bg-ok text-white"
                            : "border-surface-muted text-transparent")
                        }
                      >
                        ✓
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className={"truncate font-medium " + (it.checked ? "text-ink-faint line-through" : "text-ink")}>
                          {it.label}
                          {it.unit && <span className="text-ink-muted"> · {it.unit}</span>}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <EligibilityBadge value={it.ticketResto} onClick={() => cycleEligibility(it, setItemEligibility)} />
                          {shopper && (
                            <span className="text-xs text-ink-muted" title={shopper.name}>
                              {shopper.emoji}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setItemQuantity(it.id, it.quantity - 1)}
                          disabled={it.quantity <= 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-subtle text-lg text-ink-muted disabled:opacity-30"
                          aria-label="Diminuer"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold tabular-nums">{it.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setItemQuantity(it.id, it.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-subtle text-lg text-ink-muted"
                          aria-label="Augmenter"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition hover:text-danger"
                          aria-label="Supprimer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {idx < rows.length - 1 && <div className="ml-14 border-b border-surface-muted" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {checkedCount > 0 && (
        <button type="button" onClick={clearChecked} className="btn-ghost mt-6 w-full">
          Retirer les {checkedCount} article{checkedCount > 1 ? "s" : ""} coché{checkedCount > 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}

function EligibilityBadge({
  value,
  onClick,
}: {
  value: ListItem["ticketResto"];
  onClick: () => void;
}) {
  const tone = value === "eligible" ? "ok" : value === "ineligible" ? "neutral" : "warn";
  return (
    <button type="button" onClick={onClick} aria-label="Changer l'éligibilité ticket resto">
      <Pill tone={tone}>
        {value === "eligible" ? "🎫 " : value === "unknown" ? "❓ " : ""}
        {eligibilityLabel(value)}
      </Pill>
    </button>
  );
}

/** Fait défiler l'éligibilité : eligible → ineligible → unknown → eligible. */
function cycleEligibility(
  item: ListItem,
  set: (id: string, e: ListItem["ticketResto"]) => void,
) {
  const next =
    item.ticketResto === "eligible"
      ? "ineligible"
      : item.ticketResto === "ineligible"
        ? "unknown"
        : "eligible";
  set(item.id, next);
}
