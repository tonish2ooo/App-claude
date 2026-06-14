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
  const [latitude, setLatitude] = useState<number | undefined>(merchant?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(merchant?.longitude);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "error">("idle");

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setGeoStatus("idle");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, set: (v: string) => void) {
    const file = e.target.files?.[0];
    if (file) set(await readFileAsDataUrl(file));
  }

  function save() {
    if (!name.trim()) return;
    const fields = { name: name.trim(), address, phone, category, logoUrl, photoUrl, latitude, longitude };
    if (merchant) {
      app.updateMerchant(merchant.id, fields);
    } else {
      app.addMerchant({ ...fields, active: true });
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
      <Field label="Localisation" hint="Capture la position GPS de l'appareil (utile sur place)">
        <div className="flex items-center gap-2">
          <button type="button" className="btn-ghost" onClick={locate} disabled={geoStatus === "locating"}>
            {geoStatus === "locating" ? "Localisation…" : "📍 Me localiser"}
          </button>
          {latitude !== undefined && longitude !== undefined && (
            <>
              <span className="text-xs text-ink-muted">
                {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </span>
              <button
                type="button"
                className="text-xs font-medium text-danger"
                onClick={() => {
                  setLatitude(undefined);
                  setLongitude(undefined);
                }}
              >
                Effacer
              </button>
            </>
          )}
        </div>
        {geoStatus === "error" && (
          <p className="mt-1 text-xs text-danger">Localisation indisponible (autorisation refusée ?).</p>
        )}
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
