"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Card, Chevron, Donut, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { computeHouseholdStats } from "@/lib/calc/stats";
import { formatCents } from "@/lib/money";

function shortMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(new Date(y, m - 1, 1))
    .replace(".", "");
}

export default function StatsPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();

  const stats = useMemo(
    () => computeHouseholdStats({ budgets: state.budgets, expenses: state.expenses, month: currentMonth }),
    [state.budgets, state.expenses, currentMonth],
  );

  const budgetName = (id: string) => (id ? state.budgets.find((b) => b.id === id)?.name ?? "Budget" : "Sans budget");
  const merchantName = (id: string) => state.merchants.find((m) => m.id === id)?.name ?? "Enseigne";
  const colorFor = (id: string) => (id ? tileColorFor(id).bar : "#8e8e93");

  const segments = stats.byBudget.map((b) => ({ value: b.spentCents, color: colorFor(b.budgetId) }));
  const maxMonthly = Math.max(...stats.monthlyTotals.map((d) => d.totalCents), 1);

  return (
    <div className="space-y-1">
      <MonthSwitcher />

      {/* Répartition du mois */}
      <SectionTitle>Répartition du mois</SectionTitle>
      {stats.byBudget.length === 0 ? (
        <EmptyState icon="📊" title="Aucune dépense ce mois-ci" />
      ) : (
        <Card>
          <div className="flex justify-center py-2">
            <Donut segments={segments}>
              <span className="text-[11px] text-ink-muted">Dépensé</span>
              <span className="text-lg font-bold tracking-tight">{formatCents(stats.totalThisMonthCents)}</span>
            </Donut>
          </div>
          <div className="mt-2 space-y-1.5">
            {stats.byBudget.map((b) => {
              const pct = stats.totalThisMonthCents > 0 ? b.spentCents / stats.totalThisMonthCents : 0;
              return (
                <div key={b.budgetId || "none"} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorFor(b.budgetId) }} />
                  <span className="min-w-0 flex-1 truncate">{budgetName(b.budgetId)}</span>
                  <span className="text-ink-muted">{Math.round(pct * 100)} %</span>
                  <span className="w-20 text-right font-semibold">{formatCents(b.spentCents)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Évolution des dépenses */}
      <SectionTitle>Évolution des dépenses</SectionTitle>
      <Card>
        <div className="flex h-28 items-end justify-between gap-2">
          {stats.monthlyTotals.map((dpt) => {
            const isCurrent = dpt.month === currentMonth;
            return (
              <div key={dpt.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center" style={{ height: 84 }}>
                  <div
                    className="w-full max-w-[28px] rounded-t-md"
                    style={{
                      height: `${Math.max(4, (dpt.totalCents / maxMonthly) * 84)}px`,
                      background: isCurrent ? "#007aff" : "rgb(var(--surface-muted))",
                    }}
                    title={formatCents(dpt.totalCents)}
                  />
                </div>
                <span className="text-[10px] capitalize text-ink-muted">{shortMonthLabel(dpt.month)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Top enseignes */}
      <SectionTitle>Top enseignes</SectionTitle>
      <Card>
        {stats.topMerchants.length === 0 ? (
          <EmptyState icon="🏬" title="Aucune dépense rattachée à une enseigne" />
        ) : (
          stats.topMerchants.map((m, i) => (
            <div key={m.merchantId}>
              {i > 0 && <div className="my-3 border-t border-surface-muted" />}
              <button
                type="button"
                onClick={() => router.push(`/merchants/${m.merchantId}`)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-subtle text-xs font-bold text-ink-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{merchantName(m.merchantId)}</p>
                  <p className="text-xs text-ink-muted">{m.count} dépense{m.count > 1 ? "s" : ""}</p>
                </div>
                <span className="shrink-0 font-semibold">{formatCents(m.totalCents)}</span>
                <Chevron />
              </button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
