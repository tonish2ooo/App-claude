"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import type { Product } from "@/lib/types";
import { CATEGORY_EMOJI, CATEGORY_LABELS, eligibilityLabel } from "@/lib/courses/ticketRestaurant";
import { EmojiTile, EmptyState, Pill } from "@/components/ui/primitives";
import { TextInput } from "@/components/ui/fields";
import { ProductSheet } from "@/components/courses/ProductSheet";
import { RECEIPT_CATALOG } from "@/lib/courses/receiptCatalog";
import { formatCents } from "@/lib/money";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function ProductsPage() {
  const {
    state: { products },
    addItemFromProduct,
    importCatalog,
  } = useAppState();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function reloadCatalog() {
    const n = importCatalog(RECEIPT_CATALOG);
    setImportMsg(
      n > 0
        ? `${n} produit${n > 1 ? "s" : ""} ajout\u00e9${n > 1 ? "s" : ""} depuis vos tickets.`
        : "Tous les produits de vos tickets sont d\u00e9j\u00e0 dans la base.",
    );
    window.setTimeout(() => setImportMsg(null), 3000);
  }

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const list = q
      ? products.filter(
          (p) => normalize(p.name).includes(q) || (p.brand && normalize(p.brand).includes(q)),
        )
      : products;
    return [...list].sort((a, b) => b.timesAdded - a.timesAdded || a.name.localeCompare(b.name));
  }, [products, query]);

  function quickAdd(p: Product) {
    addItemFromProduct(p.id);
    setAdded(p.id);
    window.setTimeout(() => setAdded((cur) => (cur === p.id ? null : cur)), 1200);
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <TextInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un produit…"
          aria-label="Rechercher un produit"
        />
        <button type="button" className="btn-primary shrink-0" onClick={() => setCreating(true)}>
          + Fiche
        </button>
      </div>

      <button type="button" className="btn-ghost mb-2 w-full" onClick={reloadCatalog}>
        🧾 Recharger mes produits des tickets ({RECEIPT_CATALOG.length})
      </button>

      {importMsg && (
        <p className="mb-2 rounded-xl bg-green-50 px-3 py-2 text-center text-sm text-ok">{importMsg}</p>
      )}

      <p className="mb-2 px-1 text-xs text-ink-muted">
        {products.length} produit{products.length > 1 ? "s" : ""} dans la base · enrichie par vos
        tickets de caisse et vos dictées.
      </p>

      {products.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Base de produits vide"
          hint="Dictez des courses : chaque article crée automatiquement une fiche produit ici."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="Aucun résultat" hint={`Aucun produit ne correspond à « ${query} ».`} />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((p) => (
            <div key={p.id} className="card flex items-center gap-3">
              <button type="button" onClick={() => setEditing(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <EmojiTile emoji={CATEGORY_EMOJI[p.category]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="truncate text-xs text-ink-muted">
                    {[p.brand, CATEGORY_LABELS[p.category], p.priceCents != null ? formatCents(p.priceCents) : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <div className="mt-1">
                    <Pill tone={p.ticketResto === "eligible" ? "ok" : p.ticketResto === "unknown" ? "warn" : "neutral"}>
                      {p.ticketResto === "eligible" ? "🎫 " : ""}
                      {eligibilityLabel(p.ticketResto)}
                    </Pill>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => quickAdd(p)}
                className={
                  "shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition active:scale-95 " +
                  (added === p.id ? "bg-ok text-white" : "bg-brand-50 text-brand-600")
                }
                aria-label={`Ajouter ${p.name} à la liste`}
              >
                {added === p.id ? "✓" : "+ Liste"}
              </button>
            </div>
          ))}
        </div>
      )}

      <ProductSheet open={creating} onClose={() => setCreating(false)} />
      <ProductSheet open={!!editing} onClose={() => setEditing(null)} product={editing} />
    </div>
  );
}
