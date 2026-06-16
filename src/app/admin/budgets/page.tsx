"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { BudgetTile, Card, EmptyState, Pill, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { Sheet } from "@/components/ui/Sheet";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { getMonthlyBudgetAmount } from "@/lib/calc/budget";
import { formatCents } from "@/lib/money";

const TYPE_LABEL: Record<string, string> = { monthly: "Mensuel", annual: "Annuel", savings: "Épargne" };

export default function AdminBudgetsPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const provisions = useMemo(
    () => state.provisions.filter((p) => p.month === currentMonth && p.source === "automatic"),
    [state.provisions, currentMonth],
  );

  return (
    <div className="space-y-3">
      <AdminHeader
        title="Budgets"
        action={
          <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setCreating(true)}>
            + Ajouter
          </button>
        }
      />
      <MonthSwitcher />

      {/* Tableau résumé (desktop) / cartes (mobile) */}
      <div className="hidden sm:block">
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-3 py-2">Budget</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2 text-right">Prévu / mois</th>
              </tr>
            </thead>
            <tbody>
              {state.budgets.map((b) => (
                <tr key={b.id} className="border-t border-surface-muted">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2">
                      <BudgetTile icon={b.icon} bg={tileColorFor(b.id).bg} color={tileColorFor(b.id).bar} size={28} />
                      {b.name}
                    </span>
                  </td>
                  <td className="px-3 py-2">{TYPE_LABEL[b.type]}</td>
                  <td className="px-3 py-2 text-right">{formatCents(getMonthlyBudgetAmount(b, currentMonth))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div className="space-y-2 sm:hidden">
        {state.budgets.map((b) => (
          <Card key={b.id} onClick={() => router.push(`/budgets/${b.id}`)}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <BudgetTile icon={b.icon} bg={tileColorFor(b.id).bg} color={tileColorFor(b.id).bar} size={28} />
                <span className="truncate">{b.name}</span>
              </span>
              <span className="shrink-0 font-semibold">{formatCents(getMonthlyBudgetAmount(b, currentMonth))}</span>
            </div>
            <div className="mt-1">
              <Pill tone="neutral">{TYPE_LABEL[b.type]}</Pill>
              {!b.active && <Pill tone="neutral">Inactif</Pill>}
            </div>
          </Card>
        ))}
        {state.budgets.length === 0 && <EmptyState icon="📊" title="Aucun budget" />}
      </div>

      <SectionTitle>Provisions du mois (budgets annuels)</SectionTitle>
      <div className="space-y-2">
        {provisions.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-ink-muted">Automatique · {p.status}</p>
              </div>
              <span className="font-semibold">{formatCents(p.amountCents)}</span>
            </div>
          </Card>
        ))}
        {provisions.length === 0 && (
          <EmptyState icon="🔁" title="Aucune provision" hint="Les budgets annuels génèrent une provision automatique." />
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouveau budget">
        <BudgetForm onDone={() => setCreating(false)} />
      </Sheet>
    </div>
  );
}
