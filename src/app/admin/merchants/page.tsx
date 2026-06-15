"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { Avatar, Card, Chevron, EmptyState, Pill, SectionTitle } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { MerchantForm } from "@/components/forms/MerchantForm";
import { computeMerchantStats } from "@/lib/calc/merchants";
import { formatCents } from "@/lib/money";

// Leaflet touche window : chargement client uniquement.
const MerchantsMap = dynamic(
  () => import("@/components/merchants/MerchantsMap").then((m) => m.MerchantsMap),
  { ssr: false },
);

export default function AdminMerchantsPage() {
  const app = useAppState();
  const { state } = app;
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const hasLocated = state.merchants.some(
    (m) => m.latitude !== undefined && m.longitude !== undefined,
  );

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

      {hasLocated && (
        <>
          <SectionTitle>Carte</SectionTitle>
          <MerchantsMap merchants={state.merchants} />
        </>
      )}

      <div className="space-y-2">
        {state.merchants.map((m) => {
          const stats = computeMerchantStats(m.id, state.expenses);
          return (
            <Card key={m.id} onClick={() => router.push(`/merchants/${m.id}`)}>
              <div className="flex items-center gap-3">
                <Avatar name={m.name} src={m.logoUrl ?? m.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-ink-muted">
                    {stats.expenseCount} dépense{stats.expenseCount > 1 ? "s" : ""}
                    {stats.lastAmountCents !== null && ` · dernière ${formatCents(stats.lastAmountCents)}`}
                    {stats.averageAmountCents !== null && ` · moy. ${formatCents(stats.averageAmountCents)}`}
                  </p>
                </div>
                {!m.active && <Pill tone="neutral">Inactif</Pill>}
                <Chevron />
              </div>
            </Card>
          );
        })}
        {state.merchants.length === 0 && <EmptyState icon="🏬" title="Aucune enseigne" />}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouvelle enseigne">
        <MerchantForm onDone={() => setCreating(false)} />
      </Sheet>
    </div>
  );
}
