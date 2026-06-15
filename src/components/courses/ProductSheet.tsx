"use client";

import { useEffect, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import type { Product, ProductCategory, TicketRestoEligibility } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/courses/ticketRestaurant";
import { centsToInput, parseAmountToCents } from "@/lib/money";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];
const ELIGIBILITIES: Array<{ value: TicketRestoEligibility; label: string }> = [
  { value: "eligible", label: "🎫 Éligible ticket resto" },
  { value: "ineligible", label: "Non éligible" },
  { value: "unknown", label: "À vérifier" },
];

/** Création / édition d'une fiche produit. `product` absent ⇒ création. */
export function ProductSheet({
  open,
  onClose,
  product,
}: {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}) {
  const { addProduct, updateProduct, removeProduct } = useAppState();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ProductCategory>("autre");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [barcode, setBarcode] = useState("");
  const [eligibility, setEligibility] = useState<TicketRestoEligibility>("unknown");

  useEffect(() => {
    if (!open) return;
    setName(product?.name ?? "");
    setBrand(product?.brand ?? "");
    setDescription(product?.description ?? "");
    setCategory(product?.category ?? "autre");
    setPrice(product?.priceCents != null ? centsToInput(product.priceCents) : "");
    setUnit(product?.unit ?? "");
    setBarcode(product?.barcode ?? "");
    setEligibility(product?.ticketResto ?? "unknown");
  }, [open, product]);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const payload = {
      name: trimmed,
      brand: brand.trim() || undefined,
      description: description.trim() || undefined,
      category,
      priceCents: price.trim() ? parseAmountToCents(price) : undefined,
      unit: unit.trim() || undefined,
      barcode: barcode.trim() || undefined,
      ticketResto: eligibility,
      ticketRestoOverridden: true,
    };
    if (product) {
      updateProduct(product.id, payload);
    } else {
      addProduct(payload);
    }
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={product ? "Modifier le produit" : "Nouveau produit"}>
      <Field label="Nom descriptif">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Lait demi-écrémé 1L" autoFocus />
      </Field>
      <Field label="Marque">
        <TextInput value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Optionnel" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix (€)">
          <TextInput
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            inputMode="decimal"
            placeholder="1,05"
          />
        </Field>
        <Field label="Unité">
          <TextInput value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="L, kg, pièce…" />
        </Field>
      </div>
      <Field label="Rayon">
        <Select value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ticket restaurant" hint="Estimé automatiquement, ajustable manuellement.">
        <Select value={eligibility} onChange={(e) => setEligibility(e.target.value as TicketRestoEligibility)}>
          {ELIGIBILITIES.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Description">
        <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, format…" />
      </Field>
      <Field label="Code-barres">
        <TextInput value={barcode} onChange={(e) => setBarcode(e.target.value)} inputMode="numeric" placeholder="Optionnel" />
      </Field>

      <button type="button" className="btn-primary mt-2 w-full" onClick={save} disabled={!name.trim()}>
        {product ? "Enregistrer" : "Créer la fiche"}
      </button>
      {product && (
        <button
          type="button"
          className="btn-danger mt-2 w-full"
          onClick={() => {
            removeProduct(product.id);
            onClose();
          }}
        >
          Supprimer le produit
        </button>
      )}
    </Sheet>
  );
}
