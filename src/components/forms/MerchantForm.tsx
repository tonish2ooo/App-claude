"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { readFileAsDataUrl } from "@/lib/file";
import { geocodeAddress } from "@/lib/geo";
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
  const activeBudgets = app.state.budgets.filter((b) => b.active);
  const [defaultBudgetId, setDefaultBudgetId] = useState(
    merchant?.defaultBudgetId ?? activeBudgets[0]?.id ?? "",
  );
  const [logoUrl, setLogoUrl] = useState(merchant?.logoUrl);
  const [photoUrl, setPhotoUrl] = useState(merchant?.photoUrl);
  const [latitude, setLatitude] = useState<number | undefined>(merchant?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(merchant?.longitude);
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "geocoding" | "error" | "notfound">("idle");
  const [saving, setSaving] = useState(false);

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

  async function geocode() {
    if (!address.trim()) return;
    setGeoStatus("geocoding");
    const point = await geocodeAddress(address);
    if (point) {
      setLatitude(point.latitude);
      setLongitude(point.longitude);
      setGeoStatus("idle");
    } else {
      setGeoStatus("notfound");
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>, set: (v: string) => void) {
    const file = e.target.files?.[0];
    if (file) set(await readFileAsDataUrl(file));
  }

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    let lat = latitude;
    let lng = longitude;
    // Si une adresse est saisie sans coordonnées, on la géocode automatiquement
    // pour pouvoir afficher la mini-carte.
    if (address.trim() && (lat === undefined || lng === undefined)) {
      const point = await geocodeAddress(address);
      if (point) {
        lat = point.latitude;
        lng = point.longitude;
      }
    }
    const fields = {
      name: name.trim(),
      address,
      phone,
      category,
      defaultBudgetId: defaultBudgetId || undefined,
      logoUrl,
      photoUrl,
      latitude: lat,
      longitude: lng,
    };
    if (merchant) {
      app.updateMerchant(merchant.id, fields);
    } else {
      app.addMerchant({ ...fields, active: true });
    }
    setSaving(false);
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
      <Field label="Budget par défaut" hint="Pré-rempli lors de l'ajout d'une dépense (modifiable à ce moment-là)">
        <Select value={defaultBudgetId} onChange={(e) => setDefaultBudgetId(e.target.value)}>
          {activeBudgets.length === 0 && <option value="">— Aucun budget —</option>}
          {activeBudgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
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
      <Field label="Localisation" hint="Depuis l'adresse ci-dessus, ou la position GPS de l'appareil">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={geocode}
            disabled={geoStatus === "geocoding" || !address.trim()}
          >
            {geoStatus === "geocoding" ? "Recherche…" : "🗺️ Localiser l'adresse"}
          </button>
          <button type="button" className="btn-ghost" onClick={locate} disabled={geoStatus === "locating"}>
            {geoStatus === "locating" ? "Localisation…" : "📍 Ma position"}
          </button>
        </div>
        {latitude !== undefined && longitude !== undefined && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-ink-muted">
              📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
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
          </div>
        )}
        {geoStatus === "error" && (
          <p className="mt-1 text-xs text-danger">Position GPS indisponible (autorisation refusée ?).</p>
        )}
        {geoStatus === "notfound" && (
          <p className="mt-1 text-xs text-danger">Adresse introuvable. Précisez-la (numéro, ville).</p>
        )}
      </Field>
      <Field label="Logo">
        <input type="file" accept="image/*" onChange={(e) => onFile(e, setLogoUrl)} className="text-sm" />
      </Field>
      <Field label="Photo">
        <input type="file" accept="image/*" onChange={(e) => onFile(e, setPhotoUrl)} className="text-sm" />
      </Field>
      <button type="button" className="btn-primary w-full" disabled={!name.trim() || saving} onClick={save}>
        {saving ? "Enregistrement…" : merchant ? "Enregistrer" : "Créer l'enseigne"}
      </button>
    </div>
  );
}
