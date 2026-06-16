"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { BudgetTile, Card, Chevron, EmptyState, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { budgetProgressForMonth } from "@/lib/calc/dashboard";
import { activeBudgets } from "@/lib/calc/budget";
import { formatCents } from "@/lib/money";

export default function AlertsPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();

  const { over, near } = useMemo(() => {
    const progress = budgetProgressForMonth(state.budgets, state.expenses, currentMonth);
    const budgets = activeBudgets(state.budgets);
    const rows = progress
      .map((p) => ({ p, budget: budgets.find((b) => b.id === p.budgetId) }))
      .filter((x): x is { p: (typeof progress)[number]; budget: (typeof budgets)[number] } => Boolean(x.budget))
      .sort((a, b) => b.p.progress - a.p.progress);
    return {
      over: rows.filter((r) => r.p.progress > 1),
      near: rows.filter((r) => r.p.progress >= 0.8 && r.p.progress <= 1),
    };
  }, [state.budgets, state.expenses, currentMonth]);

  const row = (r: { p: { budgetId: string; spentCents: number; plannedMonthlyCents: number; progress: number; status: "normal" | "warning" | "over" }; budget: { id: string; name: string; icon: string } }, color: string) => {
    const tile = tileColorFor(r.budget.id);
    return (
      <button
        key={r.budget.id}
        type="button"
        onClick={() => router.push(`/budgets/${r.budget.id}`)}
        className="block w-full text-left"
      >
        <div className="flex items-center gap-3">
          <BudgetTile icon={r.budget.icon} bg={tile.bg} color={tile.bar} size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="truncate font-medium">{r.budget.name}</p>
              <span className="ml-2 shrink-0 font-semibold" style={{ color }}>
                {Math.round(r.p.progress * 100)} %
              </span>
            </div>
            <div className="mt-1.5">
              <ProgressBar progress={r.p.progress} status={r.p.status} />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {formatCents(r.p.spentCents)} / {formatCents(r.p.plannedMonthlyCents)}
            </p>
          </div>
          <Chevron />
        </div>
      </button>
    );
  };

  const empty = over.length === 0 && near.length === 0;

  return (
    <div className="space-y-1">
      <button type="button" className="mt-2 text-sm font-medium text-brand-600" onClick={() => router.back()}>
        ‹ Retour
      </button>

      <MonthSwitcher />

      {empty ? (
        <div className="mt-3">
          <EmptyState icon="✅" title="Aucune alerte" hint="Tous les budgets sont sous contrôle ce mois-ci." />
        </div>
      ) : (
        <>
          {over.length > 0 && (
            <>
              <SectionTitle>Dépassés</SectionTitle>
              <Card>
                <div className="space-y-3">
                  {over.map((r, i) => (
                    <div key={r.budget.id}>
                      {i > 0 && <div className="my-3 border-t border-surface-muted" />}
                      {row(r, "#ff3b30")}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {near.length > 0 && (
            <>
              <SectionTitle>À surveiller (≥ 80 %)</SectionTitle>
              <Card>
                <div className="space-y-3">
                  {near.map((r, i) => (
                    <div key={r.budget.id}>
                      {i > 0 && <div className="my-3 border-t border-surface-muted" />}
                      {row(r, "#ff9500")}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
