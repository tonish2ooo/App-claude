"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, Card, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { budgetProgressForMonth, budgetTotalForMonth } from "@/lib/calc/dashboard";
import { spentTotalForMonth } from "@/lib/calc/expenses";
import { computeSettlement } from "@/lib/calc/settlement";
import { computeMonthComparison } from "@/lib/calc/comparison";
import { formatCents } from "@/lib/money";
import { formatMonthLabel } from "@/lib/date";

export default function BilanPage() {
  const app = useAppState();
  const { state, currentMonth, activeUsers } = app;
  const router = useRouter();

  const userName = (id: string) => state.users.find((u) => u.id === id)?.firstName ?? "—";
  const budgetName = (id: string) => state.budgets.find((b) => b.id === id)?.name ?? "Budget";

  const data = useMemo(() => {
    const progress = budgetProgressForMonth(state.budgets, state.expenses, currentMonth);
    const settlement = computeSettlement({
      expenses: state.expenses,
      activeUsers,
      incomes: state.incomes,
      month: currentMonth,
    });
    const comparison = computeMonthComparison({ budgets: state.budgets, expenses: state.expenses, month: currentMonth });
    return {
      progress: progress.sort((a, b) => b.spentCents - a.spentCents),
      budgetTotal: budgetTotalForMonth(state.budgets, currentMonth),
      spentTotal: spentTotalForMonth(state.expenses, currentMonth),
      settlement,
      comparison,
    };
  }, [state.budgets, state.expenses, state.incomes, currentMonth, activeUsers]);

  const closed = state.monthClosures.some((c) => c.month === currentMonth);
  const archive = [...state.monthClosures].sort((a, b) => b.month.localeCompare(a.month));

  function close() {
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        `Clôturer ${formatMonthLabel(currentMonth)} et passer au mois suivant ? Le bilan sera figé.`,
      );
      if (!ok) return;
    }
    app.closeMonth();
  }

  const deltaColor = (cents: number) => (cents > 0 ? "#ff3b30" : cents < 0 ? "#34c759" : "#8e8e93");
  const deltaText = (deltaCents: number, deltaPct: number | null) => {
    const sign = deltaCents > 0 ? "+" : "";
    const pctText = deltaPct === null ? "nouveau" : `${sign}${Math.round(deltaPct * 100)} %`;
    return `${sign}${formatCents(deltaCents)} · ${pctText}`;
  };

  return (
    <div className="space-y-1">
      <MonthSwitcher />

      {/* Synthèse */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] text-ink-muted">Budget prévu</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{formatCents(data.budgetTotal)}</p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Dépensé</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{formatCents(data.spentTotal)}</p>
          <p
            className="text-[11px]"
            style={{ color: data.spentTotal <= data.budgetTotal ? "#34c759" : "#ff3b30" }}
          >
            {data.spentTotal <= data.budgetTotal ? "dans le budget" : "au-dessus du budget"}
          </p>
        </Card>
      </div>

      {/* Reste à régler */}
      <SectionTitle>Reste à régler</SectionTitle>
      <Card>
        {data.settlement.transfers.length === 0 ? (
          <p className="text-sm text-ink-muted">Comptes équilibrés ce mois-ci 👍</p>
        ) : (
          <div className="space-y-2">
            {data.settlement.transfers.map((t, i) => (
              <p key={i} className="text-sm">
                <span className="font-semibold">{userName(t.fromUserId)}</span> doit{" "}
                <span className="font-semibold" style={{ color: "#13C8A0" }}>{formatCents(t.amountCents)}</span> à{" "}
                <span className="font-semibold">{userName(t.toUserId)}</span>
              </p>
            ))}
            <p className="text-xs text-ink-muted">
              Basé sur les dépenses du compte commun ({formatCents(data.settlement.totalCommonCents)}) et la part de chacun.
            </p>
          </div>
        )}
      </Card>

      {/* Budgété vs réel par budget */}
      <SectionTitle>Budgété vs réel</SectionTitle>
      <Card>
        {data.progress.length === 0 ? (
          <EmptyState icon="📊" title="Aucun budget" />
        ) : (
          data.progress.map((p, i) => {
            const gap = p.plannedMonthlyCents - p.spentCents;
            return (
              <div key={p.budgetId}>
                {i > 0 && <div className="my-2 border-t border-surface-muted" />}
                <div className="flex items-center justify-between text-sm">
                  <span className="min-w-0 flex-1 truncate">{budgetName(p.budgetId)}</span>
                  <span className="w-24 text-right text-ink-muted">
                    {formatCents(p.spentCents)} / {formatCents(p.plannedMonthlyCents)}
                  </span>
                  <span className="w-20 text-right font-semibold" style={{ color: gap >= 0 ? "#34c759" : "#ff3b30" }}>
                    <Amount cents={gap} sign />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* Comparaison avec le mois précédent */}
      <SectionTitle>vs {formatMonthLabel(data.comparison.previous)}</SectionTitle>
      <Card>
        <div className="flex items-center justify-between border-b border-surface-muted pb-2">
          <span className="font-medium">Total dépensé</span>
          <span className="font-semibold" style={{ color: deltaColor(data.comparison.totalDeltaCents) }}>
            {deltaText(data.comparison.totalDeltaCents, data.comparison.totalDeltaPct)}
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          {data.comparison.byBudget.slice(0, 8).map((c) => (
            <div key={c.budgetId} className="flex items-center justify-between text-sm">
              <span className="min-w-0 flex-1 truncate">{budgetName(c.budgetId)}</span>
              <span className="font-semibold" style={{ color: deltaColor(c.deltaCents) }}>
                {deltaText(c.deltaCents, c.deltaPct)}
              </span>
            </div>
          ))}
          {data.comparison.byBudget.length === 0 && (
            <p className="text-sm text-ink-muted">Pas de dépenses à comparer.</p>
          )}
        </div>
      </Card>

      {/* Clôture */}
      <div className="pt-3">
        {closed ? (
          <p className="rounded-2xl bg-surface-subtle px-4 py-3 text-center text-sm text-ink-muted">
            {formatMonthLabel(currentMonth)} est clôturé ✅
          </p>
        ) : (
          <button type="button" className="btn-primary w-full" onClick={close}>
            Clôturer {formatMonthLabel(currentMonth)} et passer au suivant
          </button>
        )}
      </div>

      {/* Archive des clôtures */}
      {archive.length > 0 && (
        <>
          <SectionTitle>Mois clôturés</SectionTitle>
          <Card>
            {archive.map((c, i) => (
              <div key={c.id}>
                {i > 0 && <div className="my-3 border-t border-surface-muted" />}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium capitalize">{formatMonthLabel(c.month)}</p>
                    <p className="text-xs text-ink-muted">
                      {c.settlementTransfers.length === 0
                        ? "équilibré"
                        : c.settlementTransfers
                            .map((t) => `${userName(t.fromUserId)} → ${userName(t.toUserId)} ${formatCents(t.amountCents)}`)
                            .join(", ")}
                    </p>
                  </div>
                  <span className="font-semibold">{formatCents(c.spentTotalCents)}</span>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      <div className="pt-2">
        <button type="button" className="text-sm font-medium text-brand-600" onClick={() => router.push("/year")}>
          Voir la vue annuelle →
        </button>
      </div>
    </div>
  );
}
