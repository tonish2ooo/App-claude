"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Sheet } from "@/components/ui/Sheet";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import type { WidgetCtx } from "@/components/dashboard/WidgetCard";
import { buildDashboardSummary } from "@/lib/calc/dashboard";
import { activeBudgets } from "@/lib/calc/budget";
import { formatMonthLabel, todayIso } from "@/lib/date";

export default function DashboardPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const [incomeUserId, setIncomeUserId] = useState<string | null>(null);
  const router = useRouter();

  const syncedCommonBalanceCents = useMemo(() => {
    const conn = state.bankConnection;
    if (!conn || conn.status !== "linked") return null;
    const acc = conn.accounts.find((a) => a.id === conn.commonAccountId);
    return acc?.balanceCents ?? null;
  }, [state.bankConnection]);

  const summary = useMemo(
    () =>
      buildDashboardSummary({
        household: state.household,
        users: state.users,
        budgets: state.budgets,
        incomes: state.incomes,
        expenses: state.expenses,
        month: currentMonth,
        syncedCommonBalanceCents,
      }),
    [state, currentMonth, syncedCommonBalanceCents],
  );

  const budgets = activeBudgets(state.budgets);
  const userName = (id: string) => state.users.find((x) => x.id === id)?.firstName ?? "—";
  const merchantName = (id?: string) => state.merchants.find((m) => m.id === id)?.name ?? "Sans enseigne";
  const budgetName = (id?: string) => state.budgets.find((b) => b.id === id)?.name ?? "À catégoriser";

  const mealRemaining = summary.mealVoucherBalances.reduce((a, b) => a + b.remainingCents, 0);
  const mealGranted = summary.mealVoucherBalances.reduce((a, b) => a + b.grantedCents, 0);
  const mealRatio = mealGranted > 0 ? mealRemaining / mealGranted : 0;
  const mealColor = mealRemaining < 0 ? "#FF453A" : "#30BDF2";
  const commonRatio =
    summary.commonAccountTotalCents > 0 ? summary.commonBalanceCents / summary.commonAccountTotalCents : 0;
  const commonColor = summary.commonBalanceCents < 0 ? "#FF453A" : commonRatio < 0.15 ? "#FF9F0A" : "#13C8A0";
  const globalProgress = summary.budgetTotalCents > 0 ? summary.spentTotalCents / summary.budgetTotalCents : 0;

  const today = todayIso();
  const [yy, mm] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(yy ?? 1970, mm ?? 1, 0).getDate();
  const dayOfMonth = today.startsWith(currentMonth)
    ? Number(today.slice(8, 10))
    : today < `${currentMonth}-01`
    ? 1
    : daysInMonth;
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth);
  const perDayCents = Math.max(0, Math.round(summary.remainingBudgetCents / daysLeft));
  const onTrack = summary.spentTotalCents <= summary.budgetTotalCents * (dayOfMonth / daysInMonth);
  const lastDayLabel = `${daysInMonth} ${new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
    new Date(yy ?? 1970, (mm ?? 1) - 1, 1),
  )}`;

  const watchedBudgets = budgets
    .map((b) => ({ b, p: summary.budgetProgress.find((x) => x.budgetId === b.id) }))
    .filter((x) => (x.p?.progress ?? 0) >= 0.8)
    .sort((a, b) => (b.p?.progress ?? 0) - (a.p?.progress ?? 0))
    .map((x) => x.b);

  const toClassify = state.expenses.filter(
    (e) => (e.planned || !e.budgetId) && (e.planned || e.date.startsWith(currentMonth)),
  );

  const ctx: WidgetCtx = {
    summary,
    watchedBudgets,
    toClassify,
    goals: state.savingsGoals,
    userName,
    budgetName,
    merchantName,
    perDayCents,
    onTrack,
    globalProgress,
    lastDayLabel,
    today,
    mealRemaining,
    mealGranted,
    mealRatio,
    mealColor,
    commonRatio,
    commonColor,
    navigate: (href) => router.push(href),
  };

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

      <DashboardGrid ctx={ctx} />

      <Sheet open={incomeUserId !== null} onClose={() => setIncomeUserId(null)} title="Déclarer un revenu">
        {incomeUserId !== null && (
          <IncomeForm onDone={() => setIncomeUserId(null)} defaultUserId={incomeUserId} month={currentMonth} />
        )}
      </Sheet>
    </div>
  );
}
