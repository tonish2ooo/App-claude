"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { readFileAsDataUrl } from "@/lib/file";
import type { Merchant, MerchantCategory } from "@/lib/types";

const CATEGORIES: Array<{ value: MerchantCategory; label: string }> = [
  { value: "alimentation", label: "Alimentation" },
  { value: "restaurant", label: "Restaurant" },
  { value: "transport", label: "Transport" },
  { value: "logement", label: "Logement" },
  { value: "loisirs", label: "Loisirs" },
  { value: "sante", label: "Santé" },
  { value: "assurance", label: "Assurance" },
  { value: "abonnement", label: "Abonnement" },
  { value: "shopping", label: "Shopping" },
  { value: "autre", label: "Autre" },
];

export function MerchantForm({ onDone, merchant }: { onDone: () => void; merchant?: Merchant }) {
  const app = useAppState();
  const [name, setName] = useState(merchant?.name ?? "");
  const [address, setAddress] = useState(merchant?.address ?? "");
  const [phone, setPhone] = useState(merchant?.phone ?? "");
  const [category, setCategory] = useState<MerchantCategory>(merchant?.category ?? "autre");
  const [logoUrl, setLogoUrl] = useState(merchant?.logoUrl);
  const [photoUrl, setPhotoUrl] = useState(merchant?.photoUrl);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, set: (v: string) => void) {
    const file = e.target.files?.[0];
    if (file) set(await readFileAsDataUrl(file));
  }

  function save() {
    if (!name.trim()) return;
    if (merchant) {
      app.updateMerchant(merchant.id, { name: name.trim(), address, phone, category, logoUrl, photoUrl });
    } else {
      app.addMerchant({ name: name.trim(), address, phone, category, logoUrl, photoUrl, active: true });
    }
    onDone();
  }

  return (
    <div>
      <Field label="Nom">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Catégorie">
        <Select value={category} onChange={(e) => setCategory(e.target.value as MerchantCategory)}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Adresse">
        <TextInput value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <Field label="Téléphone">
        <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
      </Field>
      <Field label="Logo">
        <input type="file" accept="image/*" onChange={(e) => onFile(e, setLogoUrl)} className="text-sm" />
      </Field>
      <Field label="Photo">
        <input type="file" accept="image/*" onChange={(e) => onFile(e, setPhotoUrl)} className="text-sm" />
      </Field>
      <button type="button" className="btn-primary w-full" disabled={!name.trim()} onClick={save}>
        {merchant ? "Enregistrer" : "Créer l'enseigne"}
      </button>
    </div>
  );
}
