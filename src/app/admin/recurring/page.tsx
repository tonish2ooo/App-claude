"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { BudgetTile, Card, EmptyState, Pill } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { Sheet } from "@/components/ui/Sheet";
import { RecurringForm } from "@/components/forms/RecurringForm";
import { formatCents } from "@/lib/money";
import type { RecurringExpense } from "@/lib/types";

export default function AdminRecurringPage() {
  const app = useAppState();
  const { state } = app;
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);

  const budget = (id?: string) => state.budgets.find((b) => b.id === id);
  const userName = (id: string) => state.users.find((u) => u.id === id)?.firstName ?? "—";
  const monthlyTotal = state.recurringExpenses
    .filter((r) => r.active && r.paymentSource === "common_account")
    .reduce((acc, r) => acc + r.amountCents, 0);

  return (
    <div className="space-y-3">
      <AdminHeader
        title="Abonnements"
        action={
          <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setCreating(true)}>
            + Ajouter
          </button>
        }
      />

      <Card>
        <p className="text-[13px] text-ink-muted">Total mensuel récurrent (compte commun)</p>
        <p className="mt-0.5 text-2xl font-bold tracking-tight">{formatCents(monthlyTotal)}</p>
        <p className="mt-1 text-xs text-ink-muted">
          Chaque abonnement actif crée automatiquement sa dépense au jour indiqué.
        </p>
      </Card>

      <div className="space-y-2">
        {state.recurringExpenses.map((r) => {
          const b = budget(r.budgetId);
          const color = b ? tileColorFor(b.id) : { bg: "#f2f2f7", bar: "#8e8e93" };
          return (
            <Card key={r.id} onClick={() => setEditing(r)}>
              <div className="flex items-center gap-3">
                <BudgetTile icon={b?.icon ?? "package"} bg={color.bg} color={color.bar} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.label}</p>
                  <p className="text-xs text-ink-muted">
                    le {r.dayOfMonth} · {b?.name ?? "Sans budget"} · {userName(r.userId)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold">{formatCents(r.amountCents)}</span>
                  {!r.active && <Pill tone="neutral">En pause</Pill>}
                </div>
              </div>
            </Card>
          );
        })}
        {state.recurringExpenses.length === 0 && (
          <EmptyState icon="🔁" title="Aucun abonnement" hint="Ajoutez vos charges fixes (loyer, internet, assurances…)." />
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouvel abonnement">
        <RecurringForm onDone={() => setCreating(false)} />
      </Sheet>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Modifier l'abonnement">
        {editing && (
          <div>
            <RecurringForm recurring={editing} onDone={() => setEditing(null)} />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => {
                  app.toggleRecurring(editing.id);
                  setEditing(null);
                }}
              >
                {editing.active ? "Mettre en pause" : "Réactiver"}
              </button>
              <button
                type="button"
                className="btn-danger flex-1"
                onClick={() => {
                  app.removeRecurring(editing.id);
                  setEditing(null);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
