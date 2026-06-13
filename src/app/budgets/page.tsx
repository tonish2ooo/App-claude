"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, BudgetTile, Card, EmptyState, Pill, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import type { BudgetType } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { budgetProgressForMonth, budgetTotalForMonth } from "@/lib/calc/dashboard";
import { formatCents } from "@/lib/money";

const TYPE_LABEL: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  savings: "Épargne",
};

export default function BudgetsPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | BudgetType>("all");

  const progress = useMemo(
    () => budgetProgressForMonth(state.budgets, state.expenses, currentMonth),
    [state.budgets, state.expenses, currentMonth],
  );
  const total = budgetTotalForMonth(state.budgets, currentMonth);

  const sorted = [...state.budgets].sort((a, b) => a.order - b.order);
  const filtered = filter === "all" ? sorted : sorted.filter((b) => b.type === filter);

  const TABS: Array<{ value: "all" | BudgetType; label: string }> = [
    { value: "all", label: "Tous" },
    { value: "monthly", label: "Mensuels" },
    { value: "annual", label: "Annuels" },
    { value: "savings", label: "Épargne" },
  ];

  return (
    <div className="space-y-3">
      <MonthSwitcher />

      <Card className="bg-hero text-white shadow-hero">
        <p className="text-sm text-white/80">Budget total prévu du mois</p>
        <p className="mt-1 text-3xl font-bold">
          <Amount cents={total} />
        </p>
        <p className="mt-1 text-xs text-white/70">
          Mensuels + provisions des budgets annuels + épargne
        </p>
      </Card>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setFilter(t.value)}
            className={
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition " +
              (filter === t.value ? "bg-brand-600 text-white" : "bg-surface text-ink-soft shadow-card")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <SectionTitle action={
        <button type="button" className="text-sm font-semibold text-brand-600" onClick={() => setCreating(true)}>
          + Nouveau
        </button>
      }>
        {filter === "all" ? "Tous les budgets" : TABS.find((t) => t.value === filter)?.label}
      </SectionTitle>

      <div className="space-y-2">
        {filtered.map((budget) => {
          const p = progress.find((x) => x.budgetId === budget.id);
          const color = tileColorFor(budget.id);
          return (
            <Card key={budget.id} onClick={() => router.push(`/budgets/${budget.id}`)}>
              <div className="flex items-center gap-3">
                <BudgetTile icon={budget.icon} bg={color.bg} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium">{budget.name}</p>
                    {!budget.active && <Pill tone="neutral">Inactif</Pill>}
                  </div>
                  {p && budget.active && (
                    <>
                      <div className="mt-2">
                        <ProgressBar progress={p.progress} status={p.status} color={color.bar} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-ink-muted">
                        <Pill tone="neutral">{TYPE_LABEL[budget.type]}</Pill>
                        <span>
                          {formatCents(p.spentCents)} / {formatCents(p.plannedMonthlyCents)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState icon="📊" title="Aucun budget" hint="Créez votre premier budget." />
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouveau budget">
        <BudgetForm onDone={() => setCreating(false)} />
      </Sheet>
    </div>
  );
}
