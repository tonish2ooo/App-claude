"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, Card, Chevron, EmptyState, ProgressBar, RingProgress, SectionTitle } from "@/components/ui/primitives";
import { BudgetRow } from "@/components/budgets/BudgetRow";
import { ExpenseSheet } from "@/components/expenses/ExpenseSheet";
import { Sheet } from "@/components/ui/Sheet";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { buildDashboardSummary } from "@/lib/calc/dashboard";
import { activeBudgets } from "@/lib/calc/budget";
import { formatMonthLabel, todayIso } from "@/lib/date";
import { formatCents } from "@/lib/money";

export default function DashboardPage() {
  const app = useAppState();
  const { state, currentMonth, activeUsers } = app;
  const [incomeUserId, setIncomeUserId] = useState<string | null>(null);
  const [showMealDetails, setShowMealDetails] = useState(false);
  const [openExpenseId, setOpenExpenseId] = useState<string | null>(null);
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
    summary.commonBalanceCents < 0 ? "#ff3b30" : commonAccountRatio < 0.15 ? "#ff9500" : "#13C8A0";

  const globalProgress =
    summary.budgetTotalCents > 0 ? summary.spentTotalCents / summary.budgetTotalCents : 0;
  const globalStatus =
    globalProgress > 1 ? "over" : globalProgress >= 0.75 ? "warning" : "normal";
  const ringColor =
    globalStatus === "over" ? "#ff3b30" : globalStatus === "warning" ? "#ff9500" : "#13C8A0";

  // Rythme du mois : reste/jour possible et statut "dans le rythme".
  const [yy, mm] = currentMonth.split("-").map(Number);
  const daysInMonth = new Date(yy ?? 1970, mm ?? 1, 0).getDate();
  const todayStr = todayIso();
  const dayOfMonth = todayStr.startsWith(currentMonth)
    ? Number(todayStr.slice(8, 10))
    : todayStr < `${currentMonth}-01`
    ? 1
    : daysInMonth;
  const daysLeft = Math.max(1, daysInMonth - dayOfMonth);
  const perDayCents = Math.max(0, Math.round(summary.remainingBudgetCents / daysLeft));
  const onTrack = summary.spentTotalCents <= summary.budgetTotalCents * (dayOfMonth / daysInMonth);
  const monthLong = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(
    new Date(yy ?? 1970, (mm ?? 1) - 1, 1),
  );
  const lastDayLabel = `${daysInMonth} ${monthLong}`;

  // Budgets à surveiller (≥ 80 % ou dépassés), triés.
  const watchedBudgets = budgets
    .map((b) => ({ b, p: summary.budgetProgress.find((x) => x.budgetId === b.id) }))
    .filter((x) => (x.p?.progress ?? 0) >= 0.8)
    .sort((a, b) => (b.p?.progress ?? 0) - (a.p?.progress ?? 0))
    .map((x) => x.b);

  // Mouvements à traiter : planifiés (à venir) + dépenses sans budget du mois.
  const toClassify = state.expenses.filter(
    (e) =>
      (e.planned || !e.budgetId) &&
      (e.planned || e.date.startsWith(currentMonth)),
  );
  const merchantName = (id?: string) => state.merchants.find((m) => m.id === id)?.name ?? "Sans enseigne";
  const budgetName = (id?: string) => state.budgets.find((b) => b.id === id)?.name ?? "À catégoriser";

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
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink-muted">Disponible jusqu'au {lastDayLabel}</p>
              <p
                className="mt-0.5 text-[40px] font-extrabold leading-none tracking-tight"
                style={{ color: summary.remainingBudgetCents >= 0 ? "#13C8A0" : "#ff3b30" }}
              >
                <Amount cents={summary.remainingBudgetCents} />
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatCents(perDayCents)} / jour possible
              </p>
              <p className="text-xs text-ink-muted">
                {formatCents(summary.spentTotalCents)} dépensés sur {formatCents(summary.budgetTotalCents)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[13px] font-medium" style={{ color: onTrack ? "#13C8A0" : "#FF9F0A" }}>
            {Math.round(globalProgress * 100)} % utilisé · {onTrack ? "Vous êtes dans le rythme" : "Au-dessus du rythme"}
          </p>
          {watchedBudgets.length > 0 && (
            <button
              type="button"
              onClick={() => router.push("/alerts")}
              className="mt-2 text-sm font-medium text-brand-600"
            >
              Voir les budgets à risque →
            </button>
          )}
        </Card>
      </div>

      {/* À traiter */}
      {toClassify.length > 0 && (
        <>
          <SectionTitle>À traiter</SectionTitle>
          <Card className="py-1">
            {toClassify.map((e, i) => (
              <div key={e.id}>
                {i > 0 && <div className="border-t border-surface-muted/70" />}
                <div className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{merchantName(e.merchantId)}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {budgetName(e.budgetId)} · {e.date.slice(8, 10)}/{e.date.slice(5, 7)}
                      {e.planned ? " · à venir" : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{formatCents(e.amountCents)}</p>
                  <button
                    type="button"
                    onClick={() => setOpenExpenseId(e.id)}
                    className="shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600"
                  >
                    {e.planned ? "Confirmer" : "Catégoriser"}
                  </button>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}

      <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Compte commun */}
        <Card>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[13px] text-ink-muted">Compte commun</p>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={
                summary.commonBalanceStatus === "synced"
                  ? { background: "rgba(50,215,75,0.16)", color: "#32D74B" }
                  : { background: "rgba(255,255,255,0.10)", color: "rgb(var(--ink-muted))" }
              }
            >
              {summary.commonBalanceStatus === "synced" ? "Synchronisé" : "Estimé"}
            </span>
          </div>
          <p
            className="mt-1 text-2xl font-bold tracking-tight"
            style={{ color: summary.commonBalanceCents < 0 ? "#ff3b30" : "rgb(var(--ink))" }}
          >
            <Amount cents={summary.commonBalanceCents} />
          </p>
          <p className="text-xs text-ink-muted">sur {formatCents(summary.commonAccountTotalCents)}</p>
          <div className="mt-2">
            <ProgressBar progress={commonAccountRatio} status="normal" color={commonAccountColor} />
          </div>
        </Card>

        {/* Tickets restaurant */}
        {summary.mealVoucherBalances.length > 0 && (
          <Card>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] text-ink-muted">Tickets restaurant</p>
              <button
                type="button"
                onClick={() => setShowMealDetails((v) => !v)}
                className="shrink-0 text-xs font-medium text-brand-600"
              >
                {showMealDetails ? "Masquer" : "Détails"}
              </button>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: mealVouchersColor }}>
              <Amount cents={mealVouchersTotalRemaining} />
            </p>
            <p className="text-xs text-ink-muted">sur {formatCents(mealVouchersTotalGranted)}</p>
            <div className="mt-2">
              <ProgressBar progress={mealVouchersRatio} status="normal" color={mealVouchersColor} />
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
        )}
      </div>

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
      <SectionTitle action={<button type="button" onClick={() => router.push("/budgets")}>Tout voir</button>}>
        Budgets à surveiller
      </SectionTitle>
      <Card className="py-1">
        {watchedBudgets.length === 0 ? (
          <EmptyState icon="✅" title="Aucun budget à surveiller" hint="Tout est dans le rythme." />
        ) : (
          watchedBudgets.map((budget, i) => (
            <div key={budget.id}>
              {i > 0 && <div className="border-t border-surface-muted/70" />}
              <BudgetRow
                budget={budget}
                progress={summary.budgetProgress.find((p) => p.budgetId === budget.id)}
                onClick={() => router.push(`/budgets/${budget.id}`)}
              />
            </div>
          ))
        )}
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card onClick={() => router.push("/stats")}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <p className="text-sm font-medium">Statistiques</p>
          </div>
        </Card>
        <Card onClick={() => router.push("/bilan")}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧾</span>
            <p className="text-sm font-medium">Bilan du mois</p>
          </div>
        </Card>
      </div>

      <Sheet open={incomeUserId !== null} onClose={() => setIncomeUserId(null)} title="Déclarer un revenu">
        {incomeUserId !== null && (
          <IncomeForm onDone={() => setIncomeUserId(null)} defaultUserId={incomeUserId} month={currentMonth} />
        )}
      </Sheet>

      <ExpenseSheet expenseId={openExpenseId} onClose={() => setOpenExpenseId(null)} />

      {activeUsers.length === 0 && null}
    </div>
  );
}
