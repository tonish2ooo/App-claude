"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Card } from "@/components/ui/primitives";
import { Field, Segmented, TextInput } from "@/components/ui/fields";
import { centsToInput, parseAmountToCents } from "@/lib/money";
import type { AppMode } from "@/lib/types";

const MODE_LABEL: Record<AppMode, string> = { manual: "Manuel", bank: "Banque connectée", demo: "Démo" };

export default function AdminSettingsPage() {
  const app = useAppState();
  const { state } = app;
  const h = state.household;
  const [name, setName] = useState(h.name);
  const [balance, setBalance] = useState(centsToInput(h.manualCommonBalanceCents ?? 0));

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

        {h.mode !== "bank" && (
          <Field label="Solde manuel du compte commun" hint="Utilisé pour estimer le solde sans connexion bancaire">
            <TextInput
              inputMode="decimal"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              onBlur={() => app.updateHousehold({ manualCommonBalanceCents: parseAmountToCents(balance) })}
            />
          </Field>
        )}
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
