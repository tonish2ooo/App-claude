"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, Card, EmptyState, Pill, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { buildDashboardSummary } from "@/lib/calc/dashboard";
import { activeBudgets } from "@/lib/calc/budget";
import { formatMonthLabel } from "@/lib/date";
import { formatCents } from "@/lib/money";

const BALANCE_LABEL: Record<string, string> = {
  synced: "Solde synchronisé",
  estimated: "Solde estimé",
  manual: "Solde manuel",
};

export default function DashboardPage() {
  const app = useAppState();
  const { state, currentMonth, activeUsers } = app;
  const [incomeUserId, setIncomeUserId] = useState<string | null>(null);
  const router = useRouter();

  const summary = useMemo(
    () =>
      buildDashboardSummary({
        household: state.household,
        users: state.users,
        budgets: state.budgets,
        incomes: state.incomes,
        expenses: state.expenses,
        month: currentMonth,
      }),
    [state, currentMonth],
  );

  const budgets = activeBudgets(state.budgets);
  const userName = (id: string) => {
    const u = state.users.find((x) => x.id === id);
    return u ? u.firstName : "—";
  };

  return (
    <div className="space-y-3">
      <MonthSwitcher />

      {summary.missingIncomeUserIds.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-warn">
            Revenus de {formatMonthLabel(currentMonth)} non déclarés pour{" "}
            {summary.missingIncomeUserIds.map(userName).join(", ")}.
          </p>
          <button
            type="button"
            className="btn-primary mt-2 w-full"
            onClick={() => setIncomeUserId(summary.missingIncomeUserIds[0] ?? null)}
          >
            Déclarer les revenus du mois
          </button>
        </div>
      )}

      {/* Restant sur le budget du mois */}
      <Card className="bg-brand-600 text-white">
        <p className="text-sm text-brand-100">Restant sur le budget du mois</p>
        <p className="mt-1 text-3xl font-bold">
          <Amount cents={summary.remainingBudgetCents} />
        </p>
        <div className="mt-2 flex justify-between text-xs text-brand-100">
          <span>Budget prévu {formatCents(summary.budgetTotalCents)}</span>
          <span>Dépensé {formatCents(summary.spentTotalCents)}</span>
        </div>
      </Card>

      {/* Solde du compte commun */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ink-soft">Compte commun</p>
            <p className="text-2xl font-bold">
              <Amount cents={summary.commonBalanceCents} />
            </p>
          </div>
          <Pill tone={summary.commonBalanceStatus === "synced" ? "ok" : "neutral"}>
            {BALANCE_LABEL[summary.commonBalanceStatus]}
          </Pill>
        </div>
      </Card>

      {/* Tickets restaurant restants */}
      <SectionTitle>Tickets restaurant</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {summary.mealVoucherBalances.map((b) => (
          <Card key={b.userId}>
            <p className="text-xs text-ink-muted">{userName(b.userId)}</p>
            <p className="text-xl font-bold">
              <Amount cents={b.remainingCents} />
            </p>
            <p className="text-xs text-ink-muted">sur {formatCents(b.grantedCents)}</p>
          </Card>
        ))}
        {summary.mealVoucherBalances.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon="🎫" title="Aucun ticket restaurant déclaré" />
          </div>
        )}
      </div>

      {/* Contribution et reste personnel */}
      <SectionTitle>Par utilisateur</SectionTitle>
      <div className="space-y-3">
        {summary.contributions.map((c) => (
          <Card key={c.userId}>
            <div className="flex items-center justify-between">
              <p className="font-semibold">{userName(c.userId)}</p>
              <Pill tone="brand">{Math.round(c.incomeSharePct * 100)} % d'apport</Pill>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[11px] text-ink-muted">Revenu</p>
                <p className="text-sm font-semibold">{formatCents(c.incomeTotalCents)}</p>
              </div>
              <div>
                <p className="text-[11px] text-ink-muted">Contribution</p>
                <p className="text-sm font-semibold">{formatCents(c.contributionTotalCents)}</p>
              </div>
              <div>
                <p className="text-[11px] text-ink-muted">Reste</p>
                <p className="text-sm font-semibold text-ok">{formatCents(c.remainingTotalCents)}</p>
              </div>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-xs text-ink-soft">
              <span>Reste argent {formatCents(c.remainingMoneyCents)}</span>
              <span>Reste TR {formatCents(c.remainingMealVouchersCents)}</span>
            </div>
          </Card>
        ))}
        {summary.contributions.length === 0 && (
          <EmptyState icon="👥" title="Aucun utilisateur actif" hint="Ajoutez des utilisateurs dans l'admin." />
        )}
      </div>

      {/* Budgets avec progression */}
      <SectionTitle>Budgets du mois</SectionTitle>
      <div className="space-y-2">
        {budgets.map((budget) => {
          const progress = summary.budgetProgress.find((p) => p.budgetId === budget.id);
          if (!progress) return null;
          return (
            <Card key={budget.id} onClick={() => router.push(`/budgets/${budget.id}`)}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{budget.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate font-medium">{budget.name}</p>
                    <p className="text-sm font-semibold">
                      {formatCents(progress.spentCents)}
                      <span className="text-ink-muted"> / {formatCents(progress.plannedMonthlyCents)}</span>
                    </p>
                  </div>
                  <div className="mt-2">
                    <ProgressBar progress={progress.progress} status={progress.status} />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <Pill tone="neutral">
                      {budget.type === "monthly" ? "Mensuel" : budget.type === "annual" ? "Annuel" : "Épargne"}
                    </Pill>
                    <span className="text-xs text-ink-muted">{Math.round(progress.progress * 100)} %</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {budgets.length === 0 && (
          <EmptyState icon="📊" title="Aucun budget actif" hint="Créez un budget avec le bouton +." />
        )}
      </div>

      <Sheet open={incomeUserId !== null} onClose={() => setIncomeUserId(null)} title="Déclarer un revenu">
        {incomeUserId !== null && (
          <IncomeForm onDone={() => setIncomeUserId(null)} defaultUserId={incomeUserId} month={currentMonth} />
        )}
      </Sheet>

      {activeUsers.length === 0 && null}
    </div>
  );
}
