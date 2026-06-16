"use client";

import { useRef, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card } from "@/components/ui/primitives";
import { Field, Segmented, TextInput } from "@/components/ui/fields";
import { ThemeToggle } from "@/components/settings/ThemeToggle";
import { CloudSync } from "@/components/settings/CloudSync";
import { todayIso } from "@/lib/date";
import type { AppMode } from "@/lib/types";

const MODE_LABEL: Record<AppMode, string> = { manual: "Manuel", bank: "Banque connectée", demo: "Démo" };

export default function AdminSettingsPage() {
  const app = useAppState();
  const { state } = app;
  const h = state.household;
  const [name, setName] = useState(h.name);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  function exportData() {
    if (typeof window === "undefined") return;
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeName = (h.name || "foyer").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    link.href = url;
    link.download = `comptes-${safeName}-${todayIso()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    setImportError(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (typeof window !== "undefined" && !window.confirm("Remplacer toutes les données actuelles par ce fichier ?")) {
        return;
      }
      const ok = app.importState(parsed);
      if (!ok) setImportError("Fichier invalide : données du foyer introuvables.");
    } catch {
      setImportError("Impossible de lire ce fichier (JSON invalide).");
    }
  }

  return (
    <div className="space-y-3">
      <AdminHeader title="Paramètres du foyer" />

      <Card className="space-y-1">
        <Field label="Nom du foyer">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} onBlur={() => app.updateHousehold({ name })} />
        </Field>

        <Field label="Mode">
          <Segmented
            value={h.mode}
            onChange={(v) => app.updateHousehold({ mode: v })}
            options={[
              { value: "manual", label: MODE_LABEL.manual },
              { value: "bank", label: MODE_LABEL.bank },
              { value: "demo", label: MODE_LABEL.demo },
            ]}
          />
        </Field>

        <Field label="Devise par défaut">
          <TextInput
            value={h.defaultCurrency}
            onChange={(e) => app.updateHousehold({ defaultCurrency: e.target.value.toUpperCase() })}
          />
        </Field>

        <p className="px-1 pt-1 text-xs text-ink-muted">
          Le solde du compte commun est calculé automatiquement : total des
          contributions du mois (hors tickets restaurant) moins les dépenses
          payées depuis le compte commun.
        </p>
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium">Apparence</p>
        <Field label="Thème">
          <ThemeToggle />
        </Field>
      </Card>

      <CloudSync />

      <Card className="space-y-2">
        <p className="text-sm font-medium">Sauvegarde</p>
        <p className="text-xs text-ink-muted">
          Vos données sont stockées sur cet appareil. Exportez-les régulièrement pour ne rien perdre.
        </p>
        <button type="button" className="btn-ghost w-full" onClick={exportData}>
          Exporter mes données (JSON)
        </button>
        <button type="button" className="btn-ghost w-full" onClick={() => fileInputRef.current?.click()}>
          Importer un fichier de sauvegarde
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importData(file);
            e.target.value = "";
          }}
        />
        {importError && <p className="text-xs text-danger">{importError}</p>}
      </Card>

      <Card className="space-y-2">
        <p className="text-sm font-medium">Données</p>
        <button type="button" className="btn-ghost w-full" onClick={() => app.loadDemo()}>
          Charger les données de démonstration
        </button>
        <button
          type="button"
          className="btn-danger w-full"
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm("Réinitialiser toutes les données ?")) {
              app.resetEmpty();
            }
          }}
        >
          Réinitialiser le foyer
        </button>
      </Card>
    </div>
  );
}
