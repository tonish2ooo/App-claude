"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { Amount, Card, EmptyState, Pill, ProgressBar, SectionTitle } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { getMonthlyBudgetAmount } from "@/lib/calc/budget";
import { budgetContributions } from "@/lib/calc/contributions";
import { spentForBudget } from "@/lib/calc/expenses";
import { formatCents } from "@/lib/money";
import { formatMonthLabel } from "@/lib/date";

const TYPE_LABEL: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  savings: "Épargne",
};

export default function BudgetDetailPage() {
  const app = useAppState();
  const { state, currentMonth, activeUsers } = app;
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [editing, setEditing] = useState(false);

  const budget = state.budgets.find((b) => b.id === id);

  const data = useMemo(() => {
    if (!budget) return null;
    const year = currentMonth.slice(0, 4);
    const monthlyPlanned = getMonthlyBudgetAmount(budget, currentMonth);
    const spentMonth = spentForBudget(state.expenses, budget.id, currentMonth);

    const provisionedYtd = state.provisions
      .filter(
        (p) =>
          p.budgetId === budget.id &&
          p.status === "active" &&
          p.month.startsWith(year) &&
          p.month <= currentMonth,
      )
      .reduce((acc, p) => acc + p.amountCents, 0);

    const realYtd = state.expenses
      .filter((e) => e.budgetId === budget.id && e.date.startsWith(year))
      .reduce((acc, e) => acc + e.amountCents, 0);

    const expenses = state.expenses
      .filter((e) => e.budgetId === budget.id)
      .sort((a, b) => b.date.localeCompare(a.date));

    const contributions = budgetContributions(budget, activeUsers, state.incomes, currentMonth);

    return {
      monthlyPlanned,
      spentMonth,
      provisionedYtd,
      realYtd,
      expenses,
      contributions,
      progress: monthlyPlanned > 0 ? spentMonth / monthlyPlanned : 0,
    };
  }, [budget, state.expenses, state.provisions, state.incomes, currentMonth, activeUsers]);

  if (!budget || !data) {
    return (
      <div className="space-y-3">
        <EmptyState icon="🔍" title="Budget introuvable" />
        <button type="button" className="btn-ghost w-full" onClick={() => router.push("/budgets")}>
          Retour aux budgets
        </button>
      </div>
    );
  }

  const merchantName = (mid?: string) => state.merchants.find((m) => m.id === mid)?.name ?? "Sans enseigne";
  const userName = (uid: string) => state.users.find((u) => u.id === uid)?.firstName ?? "—";
  const status = data.progress > 1 ? "over" : data.progress >= 0.75 ? "warning" : "normal";

  return (
    <div className="space-y-3">
      <button type="button" className="text-sm text-brand-600" onClick={() => router.back()}>
        ‹ Retour
      </button>

      <Card>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{budget.icon}</span>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{budget.name}</h1>
            <Pill tone="neutral">{TYPE_LABEL[budget.type]}</Pill>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-ink-soft">Dépensé ce mois</span>
            <span className="font-semibold">
              {formatCents(data.spentMonth)} / {formatCents(data.monthlyPlanned)}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar progress={data.progress} status={status} />
          </div>
          <p className="mt-1 text-right text-xs text-ink-muted">{Math.round(data.progress * 100)} % atteint</p>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-ink-muted">{budget.type === "annual" ? "Montant annuel" : "Montant prévu"}</p>
          <p className="text-lg font-bold">
            <Amount cents={budget.amountCents} />
          </p>
        </Card>
        <Card>
          <p className="text-xs text-ink-muted">Prévu / mois</p>
          <p className="text-lg font-bold">
            <Amount cents={data.monthlyPlanned} />
          </p>
        </Card>
        {budget.type === "annual" && (
          <>
            <Card>
              <p className="text-xs text-ink-muted">Provisionné (année)</p>
              <p className="text-lg font-bold">
                <Amount cents={data.provisionedYtd} />
              </p>
            </Card>
            <Card>
              <p className="text-xs text-ink-muted">Réel payé (année)</p>
              <p className="text-lg font-bold">
                <Amount cents={data.realYtd} />
              </p>
            </Card>
            <Card className="col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-ink-muted">Écart provisionné − réel</p>
                <p className="text-lg font-bold">
                  <Amount cents={data.provisionedYtd - data.realYtd} sign />
                </p>
              </div>
            </Card>
          </>
        )}
      </div>

      <SectionTitle>Contribution par utilisateur ({formatMonthLabel(currentMonth)})</SectionTitle>
      <Card>
        <p className="mb-2 text-xs text-ink-muted">
          Répartition : {budget.splitRule.mode === "prorata" ? "au prorata des revenus" : "personnalisée"}
        </p>
        <div className="space-y-1">
          {data.contributions.map((c) => (
            <div key={c.userId} className="flex justify-between text-sm">
              <span>{userName(c.userId)}</span>
              <span className="font-semibold">{formatCents(c.amountCents)}</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>Dépenses associées</SectionTitle>
      <div className="space-y-2">
        {data.expenses.map((e) => (
          <Card key={e.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{merchantName(e.merchantId)}</p>
                <p className="text-xs text-ink-muted">
                  {e.date} · {e.paymentSource === "meal_voucher" ? "Tickets resto" : "Compte commun"}
                </p>
              </div>
              <p className="font-semibold">{formatCents(e.amountCents)}</p>
            </div>
          </Card>
        ))}
        {data.expenses.length === 0 && <EmptyState icon="🧾" title="Aucune dépense associée" />}
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" className="btn-ghost flex-1" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button
          type="button"
          className="btn-ghost flex-1"
          onClick={() => app.toggleBudget(budget.id)}
        >
          {budget.active ? "Désactiver" : "Activer"}
        </button>
        <button
          type="button"
          className="btn-danger flex-1"
          onClick={() => {
            app.removeBudget(budget.id);
            router.push("/budgets");
          }}
        >
          Supprimer
        </button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Modifier le budget">
        <BudgetForm budget={budget} onDone={() => setEditing(false)} />
      </Sheet>
    </div>
  );
}
