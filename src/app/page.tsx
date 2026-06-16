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
  const [showMealDetails, setShowMealDetails] = useState(false);
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

  const mealVouchersTotalRemaining = summary.mealVoucherBalances.reduce(
    (acc, b) => acc + b.remainingCents,
    0,
  );
  const mealVouchersTotalGranted = summary.mealVoucherBalances.reduce(
    (acc, b) => acc + b.grantedCents,
    0,
  );
  const mealVouchersRatio =
    mealVouchersTotalGranted > 0 ? mealVouchersTotalRemaining / mealVouchersTotalGranted : 0;
  const mealVouchersColor = mealVouchersTotalRemaining < 0 ? "#ff3b30" : "#32ade6";
  const commonAccountRatio =
    summary.commonAccountTotalCents > 0
      ? summary.commonBalanceCents / summary.commonAccountTotalCents
      : 0;
  const commonAccountColor =
    summary.commonBalanceCents < 0 ? "#ff3b30" : commonAccountRatio < 0.15 ? "#ff9500" : "#007aff";

  const globalProgress =
    summary.budgetTotalCents > 0 ? summary.spentTotalCents / summary.budgetTotalCents : 0;
  const globalStatus =
    globalProgress > 1 ? "over" : globalProgress >= 0.75 ? "warning" : "normal";
  const ringColor =
    globalStatus === "over" ? "#ff3b30" : globalStatus === "warning" ? "#ff9500" : "#007aff";

  // Budgets dépassés (>100 %) ou proches (>=80 %).
  const overCount = summary.budgetProgress.filter((p) => p.progress > 1).length;
  const nearCount = summary.budgetProgress.filter((p) => p.progress >= 0.8 && p.progress <= 1).length;
  const alertColor = overCount > 0 ? "#ff3b30" : nearCount > 0 ? "#ff9500" : "#34c759";
  const alertLabel =
    overCount > 0
      ? `${overCount} budget${overCount > 1 ? "s" : ""} dépassé${overCount > 1 ? "s" : ""}`
      : nearCount > 0
      ? `${nearCount} budget${nearCount > 1 ? "s" : ""} à surveiller`
      : "Budgets sous contrôle";

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

      {/* Bouton d'alertes budgets (couleur selon l'état) */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => router.push("/alerts")}
          className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-white shadow-card transition active:scale-[0.99]"
          style={{ background: alertColor }}
        >
          <span className="flex items-center gap-2 font-semibold">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.9" className="h-5 w-5">
              <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {alertLabel}
          </span>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-4 w-4">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

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
                style={{ color: summary.remainingBudgetCents >= 0 ? "rgb(var(--ink))" : "#ff3b30" }}
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
          <div className="flex items-center gap-4">
            <RingProgress progress={commonAccountRatio} size={56} stroke={6} color={commonAccountColor}>
              <span className="text-[10px] font-bold" style={{ color: commonAccountColor }}>
                {Math.round(commonAccountRatio * 100)}%
              </span>
            </RingProgress>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-[13px] text-ink-muted">Compte commun</p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={
                    summary.commonBalanceStatus === "synced"
                      ? { background: "#e8faf0", color: "#34c759" }
                      : { background: "#f2f2f7", color: "#8e8e93" }
                  }
                >
                  {summary.commonBalanceStatus === "synced" ? "Synchronisé" : "Estimé"}
                </span>
              </div>
              <p
                className="mt-0.5 text-2xl font-bold tracking-tight"
                style={{ color: summary.commonBalanceCents < 0 ? "#ff3b30" : "rgb(var(--ink))" }}
              >
                <Amount cents={summary.commonBalanceCents} />
                <span className="text-sm font-normal text-ink-muted">
                  {" "}/ {formatCents(summary.commonAccountTotalCents)}
                </span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Solde total tickets restaurant + détail par utilisateur */}
      {summary.mealVoucherBalances.length > 0 && (
        <div className="mt-2">
          <Card>
            <div className="flex items-center gap-4">
              <RingProgress progress={mealVouchersRatio} size={56} stroke={6} color={mealVouchersColor}>
                <span className="text-[10px] font-bold" style={{ color: mealVouchersColor }}>
                  {Math.round(mealVouchersRatio * 100)}%
                </span>
              </RingProgress>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-ink-muted">Tickets restaurant</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight" style={{ color: mealVouchersColor }}>
                  <Amount cents={mealVouchersTotalRemaining} />
                  <span className="text-sm font-normal text-ink-muted">
                    {" "}/ {formatCents(mealVouchersTotalGranted)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMealDetails((v) => !v)}
                className="text-sm font-medium text-brand-600"
              >
                {showMealDetails ? "Masquer" : "Détails"}
              </button>
            </div>

            {showMealDetails && (
              <div className="mt-3 space-y-2 border-t border-surface-muted pt-3">
                {summary.mealVoucherBalances.map((b) => (
                  <div key={b.userId} className="flex items-center justify-between">
                    <span className="text-sm">{userName(b.userId)}</span>
                    <span className="text-sm font-semibold" style={{ color: "#32ade6" }}>
                      <Amount cents={b.remainingCents} />
                      <span className="font-normal text-ink-muted"> / {formatCents(b.grantedCents)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
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
                  <p className="text-[10px] text-ink-muted">Argent de poche</p>
                  <p
                    className="text-xs font-bold"
                    style={{ color: c.remainingTotalCents < 0 ? "#ff3b30" : "#34c759" }}
                  >
                    {formatCents(c.remainingTotalCents)}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-subtle p-2 text-center">
                  <p className="text-[10px] text-ink-muted">Reste TR</p>
                  <p
                    className="text-xs font-bold"
                    style={{ color: c.remainingMealVouchersCents < 0 ? "#ff3b30" : "#32ade6" }}
                  >
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

      <div className="mt-3">
        <Card onClick={() => router.push("/stats")}>
          <div className="flex items-center gap-3">
            <span className="text-xl">📈</span>
            <p className="flex-1 font-medium">Statistiques du foyer</p>
            <Chevron />
          </div>
        </Card>
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
