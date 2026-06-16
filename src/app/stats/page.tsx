"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Card, Chevron, Donut, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { computeHouseholdStats } from "@/lib/calc/stats";
import { formatCents } from "@/lib/money";
import { lastNMonths, monthsOfYearUpTo } from "@/lib/date";

type Period = "month" | "3m" | "6m" | "12m" | "year";

const PERIOD_OPTIONS: Array<{ value: Period; label: string }> = [
  { value: "month", label: "Mois" },
  { value: "3m", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "12m", label: "12 mois" },
  { value: "year", label: "Année" },
];

function shortMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(new Date(y, m - 1, 1)).replace(".", "");
}

export default function StatsPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("6m");

  const months = useMemo(() => {
    if (period === "month") return [currentMonth];
    if (period === "year") return monthsOfYearUpTo(currentMonth);
    return lastNMonths(currentMonth, period === "3m" ? 3 : period === "12m" ? 12 : 6);
  }, [period, currentMonth]);

  const stats = useMemo(
    () => computeHouseholdStats({ budgets: state.budgets, expenses: state.expenses, months }),
    [state.budgets, state.expenses, months],
  );

  const budgetName = (id: string) => (id ? state.budgets.find((b) => b.id === id)?.name ?? "Budget" : "Sans budget");
  const userName = (id: string) => state.users.find((u) => u.id === id)?.firstName ?? "—";
  const merchantName = (id: string) => state.merchants.find((m) => m.id === id)?.name ?? "Enseigne";
  const colorFor = (id: string) => (id ? tileColorFor(id).bar : "#8e8e93");

  const segments = stats.byBudget.map((b) => ({ value: b.spentCents, color: colorFor(b.budgetId) }));
  const maxMonthly = Math.max(...stats.monthlyTotals.map((d) => d.totalCents), 1);
  const payTotal = stats.byPaymentSource.commonAccountCents + stats.byPaymentSource.mealVoucherCents;
  const commonPct = payTotal > 0 ? stats.byPaymentSource.commonAccountCents / payTotal : 1;
  const userColors = ["#007aff", "#ff2d55", "#34c759", "#ff9500"];

  return (
    <div className="space-y-1">
      <MonthSwitcher />

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition " +
              (period === p.value ? "bg-brand-600 text-white" : "bg-surface text-ink-muted shadow-card")
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Résumé de la période */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] text-ink-muted">Total période</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{formatCents(stats.totalCents)}</p>
          <p className="text-[11px] text-ink-muted">
            {stats.months.length} mois · {stats.expenseCount} dépenses
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Moyenne / mois</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{formatCents(stats.avgPerMonthCents)}</p>
          <p className="text-[11px] text-ink-muted">
            panier moyen {stats.avgPerExpenseCents !== null ? formatCents(stats.avgPerExpenseCents) : "—"}
          </p>
        </Card>
      </div>

      {/* Répartition par budget */}
      <SectionTitle>Répartition par budget</SectionTitle>
      {stats.byBudget.length === 0 ? (
        <EmptyState icon="📊" title="Aucune dépense sur la période" />
      ) : (
        <Card>
          <div className="flex justify-center py-2">
            <Donut segments={segments}>
              <span className="text-[11px] text-ink-muted">Dépensé</span>
              <span className="text-lg font-bold tracking-tight">{formatCents(stats.totalCents)}</span>
            </Donut>
          </div>
          <div className="mt-2 space-y-1.5">
            {stats.byBudget.map((b) => {
              const pct = stats.totalCents > 0 ? b.spentCents / stats.totalCents : 0;
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

      {/* Évolution */}
      <SectionTitle>Évolution des dépenses</SectionTitle>
      <Card>
        <div className="flex h-28 items-end justify-between gap-1.5">
          {stats.monthlyTotals.map((dpt) => {
            const isCurrent = dpt.month === currentMonth;
            return (
              <div key={dpt.month} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center" style={{ height: 84 }}>
                  <div
                    className="w-full max-w-[26px] rounded-t-md"
                    style={{
                      height: `${Math.max(3, (dpt.totalCents / maxMonthly) * 84)}px`,
                      background: isCurrent ? "#007aff" : "rgb(var(--surface-muted))",
                    }}
                    title={formatCents(dpt.totalCents)}
                  />
                </div>
                <span className="text-[9px] capitalize text-ink-muted">{shortMonthLabel(dpt.month)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Par personne */}
      {stats.byUser.length > 0 && (
        <>
          <SectionTitle>Dépenses par personne</SectionTitle>
          <Card>
            <div className="space-y-2">
              {stats.byUser.map((u, i) => {
                const pct = stats.totalCents > 0 ? u.spentCents / stats.totalCents : 0;
                const color = userColors[i % userColors.length];
                return (
                  <div key={u.userId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{userName(u.userId)}</span>
                      <span className="font-semibold">
                        {formatCents(u.spentCents)} <span className="font-normal text-ink-muted">· {Math.round(pct * 100)} %</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div style={{ width: `${pct * 100}%`, background: color, height: "100%" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {/* Mode de paiement */}
      {payTotal > 0 && (
        <>
          <SectionTitle>Mode de paiement</SectionTitle>
          <Card>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div style={{ width: `${commonPct * 100}%`, background: "#007aff" }} />
              <div style={{ width: `${(1 - commonPct) * 100}%`, background: "#32ade6" }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span style={{ color: "#007aff" }}>Compte commun {formatCents(stats.byPaymentSource.commonAccountCents)}</span>
              <span style={{ color: "#32ade6" }}>Tickets resto {formatCents(stats.byPaymentSource.mealVoucherCents)}</span>
            </div>
          </Card>
        </>
      )}

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
