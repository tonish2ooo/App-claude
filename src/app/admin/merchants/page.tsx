"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Avatar, Card, EmptyState, Pill } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { MerchantForm } from "@/components/forms/MerchantForm";
import { computeMerchantStats } from "@/lib/calc/merchants";
import { formatCents } from "@/lib/money";
import type { Merchant } from "@/lib/types";

export default function AdminMerchantsPage() {
  const app = useAppState();
  const { state } = app;
  const [editing, setEditing] = useState<Merchant | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <AdminHeader
        title="Enseignes"
        action={
          <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setCreating(true)}>
            + Ajouter
          </button>
        }
      />

      <div className="space-y-2">
        {state.merchants.map((m) => {
          const stats = computeMerchantStats(m.id, state.expenses);
          return (
            <Card key={m.id} onClick={() => setEditing(m)}>
              <div className="flex items-center gap-3">
                <Avatar name={m.name} src={m.logoUrl ?? m.photoUrl} />
                <div className="flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-ink-muted">
                    {stats.expenseCount} dépense{stats.expenseCount > 1 ? "s" : ""}
                    {stats.lastAmountCents !== null && ` · dernière ${formatCents(stats.lastAmountCents)}`}
                    {stats.averageAmountCents !== null && ` · moy. ${formatCents(stats.averageAmountCents)}`}
                  </p>
                </div>
                {!m.active && <Pill tone="neutral">Inactif</Pill>}
              </div>
            </Card>
          );
        })}
        {state.merchants.length === 0 && <EmptyState icon="🏬" title="Aucune enseigne" />}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouvelle enseigne">
        <MerchantForm onDone={() => setCreating(false)} />
      </Sheet>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Fiche enseigne">
        {editing && (
          <div>
            <MerchantForm merchant={editing} onDone={() => setEditing(null)} />
            <button
              type="button"
              className="btn-danger mt-3 w-full"
              onClick={() => {
                app.removeMerchant(editing.id);
                setEditing(null);
              }}
            >
              Supprimer l&apos;enseigne
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
