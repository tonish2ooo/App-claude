"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, BudgetTile, Card, Chevron, EmptyState, RingProgress, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { Sheet } from "@/components/ui/Sheet";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { buildDashboardSummary } from "@/lib/calc/dashboard";
import { activeBudgets } from "@/lib/calc/budget";
import { formatMonthLabel } from "@/lib/date";
import { formatCents } from "@/lib/money";

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
  const userName = (id: string) => state.users.find((x) => x.id === id)?.firstName ?? "—";

  const globalProgress =
    summary.budgetTotalCents > 0 ? summary.spentTotalCents / summary.budgetTotalCents : 0;
  const globalStatus =
    globalProgress > 1 ? "over" : globalProgress >= 0.75 ? "warning" : "normal";
  const ringColor =
    globalStatus === "over" ? "#ff3b30" : globalStatus === "warning" ? "#ff9500" : "#007aff";

  return (
    <div className="space-y-1">
      <MonthSwitcher />

      {summary.missingIncomeUserIds.length > 0 && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
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

      {/* Hero metric card — budget restant */}
      <div className="mt-3">
        <Card>
          <div className="flex items-center gap-4">
            <RingProgress
              progress={globalProgress}
              size={72}
              stroke={7}
              color={ringColor}
              bg="#e5e5ea"
            >
              <span className="text-[11px] font-semibold text-ink-muted">
                {Math.round(globalProgress * 100)}%
              </span>
            </RingProgress>
            <div className="flex-1">
              <p className="text-[13px] text-ink-muted">Restant ce mois</p>
              <p
                className="mt-0.5 text-[32px] font-bold leading-none tracking-tight"
                style={{ color: summary.remainingBudgetCents >= 0 ? "#000" : "#ff3b30" }}
              >
                <Amount cents={summary.remainingBudgetCents} />
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatCents(summary.spentTotalCents)} dépensés sur {formatCents(summary.budgetTotalCents)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Solde compte commun */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-ink-muted">Compte commun</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">
                <Amount cents={summary.commonBalanceCents} />
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={
                summary.commonBalanceStatus === "synced"
                  ? { background: "#e8faf0", color: "#34c759" }
                  : { background: "#f2f2f7", color: "#8e8e93" }
              }
            >
              {summary.commonBalanceStatus === "synced" ? "Synchronisé" : "Estimé"}
            </span>
          </div>
        </Card>
      </div>

      {/* Tickets restaurant */}
      {summary.mealVoucherBalances.length > 0 && (
        <>
          <SectionTitle>Tickets restaurant</SectionTitle>
          <Card>
            {summary.mealVoucherBalances.map((b, i) => {
              const used = b.grantedCents > 0 ? b.spentCents / b.grantedCents : 0;
              const mealColor = used > 0.9 ? "#ff3b30" : used >= 0.7 ? "#ff9500" : "#32ade6";
              return (
                <div key={b.userId}>
                  {i > 0 && <div className="my-3 border-t border-surface-muted" />}
                  <div className="flex items-center gap-3">
                    <RingProgress progress={used} size={52} stroke={5} color={mealColor}>
                      <span className="text-[9px] font-bold" style={{ color: mealColor }}>
                        {Math.round(used * 100)}%
                      </span>
                    </RingProgress>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold">{userName(b.userId)}</p>
                      <p className="text-sm font-bold" style={{ color: mealColor }}>
                        <Amount cents={b.remainingCents} /> restants
                      </p>
                      <p className="text-xs text-ink-muted">sur {formatCents(b.grantedCents)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </>
      )}

      {/* Par utilisateur */}
      <SectionTitle>Par personne</SectionTitle>
      <Card>
        {summary.contributions.length === 0 ? (
          <EmptyState icon="👥" title="Aucun utilisateur actif" hint="Ajoutez des utilisateurs dans l'admin." />
        ) : (
          summary.contributions.map((c, i) => (
            <div key={c.userId}>
              {i > 0 && <div className="my-3 border-t border-surface-muted" />}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{userName(c.userId)}</p>
                  <p className="text-xs text-ink-muted">{Math.round(c.incomeSharePct * 100)} % du foyer</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-ink-muted">Revenu</p>
                  <p className="text-sm font-semibold">{formatCents(c.incomeTotalCents)}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-surface-subtle p-2 text-center">
                  <p className="text-[10px] text-ink-muted">Contribution</p>
                  <p className="text-xs font-bold">{formatCents(c.contributionTotalCents)}</p>
                </div>
                <div className="rounded-xl bg-surface-subtle p-2 text-center">
                  <p className="text-[10px] text-ink-muted">Reste argent</p>
                  <p className="text-xs font-bold text-ok">{formatCents(c.remainingMoneyCents)}</p>
                </div>
                <div className="rounded-xl bg-surface-subtle p-2 text-center">
                  <p className="text-[10px] text-ink-muted">Reste TR</p>
                  <p className="text-xs font-bold" style={{ color: "#32ade6" }}>
                    {formatCents(c.remainingMealVouchersCents)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Budgets du mois */}
      <SectionTitle>
        Budgets du mois
      </SectionTitle>
      <Card>
        {budgets.length === 0 ? (
          <EmptyState icon="📊" title="Aucun budget actif" hint="Créez un budget avec le bouton +." />
        ) : (
          budgets.map((budget, i) => {
            const progress = summary.budgetProgress.find((p) => p.budgetId === budget.id);
            if (!progress) return null;
            const color = tileColorFor(budget.id);
            const status =
              progress.progress > 1 ? "over" : progress.progress >= 0.75 ? "warning" : "normal";
            const ringC =
              status === "over" ? "#ff3b30" : status === "warning" ? "#ff9500" : color.bar;

            return (
              <div key={budget.id}>
                {i > 0 && <div className="my-3 border-t border-surface-muted" />}
                <button
                  type="button"
                  onClick={() => router.push(`/budgets/${budget.id}`)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <BudgetTile icon={budget.icon} bg={color.bg} color={color.bar} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{budget.name}</p>
                    <p className="text-xs text-ink-muted">
                      {formatCents(progress.spentCents)} / {formatCents(progress.plannedMonthlyCents)}
                    </p>
                  </div>
                  <RingProgress progress={progress.progress} size={38} stroke={3.5} color={ringC}>
                    <span className="text-[9px] font-bold" style={{ color: ringC }}>
                      {Math.round(progress.progress * 100)}%
                    </span>
                  </RingProgress>
                  <Chevron />
                </button>
              </div>
            );
          })
        )}
      </Card>

      <Sheet open={incomeUserId !== null} onClose={() => setIncomeUserId(null)} title="Déclarer un revenu">
        {incomeUserId !== null && (
          <IncomeForm onDone={() => setIncomeUserId(null)} defaultUserId={incomeUserId} month={currentMonth} />
        )}
      </Sheet>

      {activeUsers.length === 0 && null}
    </div>
  );
}
