"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { Amount, BudgetTile, Card, Chevron, EmptyState, RingProgress, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { Sheet } from "@/components/ui/Sheet";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  const budget = state.budgets.find((b) => b.id === id);
  const editingExpense = state.expenses.find((e) => e.id === editingExpenseId);

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
  const color = tileColorFor(budget.id);
  const status = data.progress > 1 ? "over" : data.progress >= 0.75 ? "warning" : "normal";
  const ringColor = status === "over" ? "#ff3b30" : status === "warning" ? "#ff9500" : color.bar;

  return (
    <div className="space-y-1">
      <button type="button" className="mt-2 text-sm font-medium text-brand-600" onClick={() => router.back()}>
        ‹ Retour
      </button>

      {/* Header card */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center gap-4">
            <RingProgress progress={data.progress} size={76} stroke={7} color={ringColor}>
              <span className="text-[11px] font-bold" style={{ color: ringColor }}>
                {Math.round(data.progress * 100)}%
              </span>
            </RingProgress>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <BudgetTile icon={budget.icon} bg={color.bg} color={color.bar} size={32} />
                <h1 className="text-lg font-bold">{budget.name}</h1>
              </div>
              <p className="mt-1 text-[13px] text-ink-muted">{TYPE_LABEL[budget.type]}</p>
              <p className="mt-0.5 text-sm font-semibold">
                {formatCents(data.spentMonth)}
                <span className="font-normal text-ink-muted"> / {formatCents(data.monthlyPlanned)}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] text-ink-muted">{budget.type === "annual" ? "Montant annuel" : "Montant prévu"}</p>
          <p className="mt-1 text-xl font-bold tracking-tight">
            <Amount cents={budget.amountCents} />
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Prévu / mois</p>
          <p className="mt-1 text-xl font-bold tracking-tight">
            <Amount cents={data.monthlyPlanned} />
          </p>
        </Card>
        {budget.type === "annual" && (
          <>
            <Card>
              <p className="text-[11px] text-ink-muted">Provisionné (année)</p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                <Amount cents={data.provisionedYtd} />
              </p>
            </Card>
            <Card>
              <p className="text-[11px] text-ink-muted">Réel payé (année)</p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                <Amount cents={data.realYtd} />
              </p>
            </Card>
            <Card className="col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-ink-muted">Écart provisionné − réel</p>
                <p
                  className="text-lg font-bold"
                  style={{ color: data.provisionedYtd - data.realYtd >= 0 ? "#34c759" : "#ff3b30" }}
                >
                  <Amount cents={data.provisionedYtd - data.realYtd} sign />
                </p>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Contributions */}
      <SectionTitle>Contribution ({formatMonthLabel(currentMonth)})</SectionTitle>
      <Card>
        <p className="mb-3 text-[11px] text-ink-muted">
          {budget.splitRule.mode === "prorata" ? "Au prorata des revenus" : "Répartition personnalisée"}
        </p>
        {data.contributions.map((c, i) => (
          <div key={c.userId}>
            {i > 0 && <div className="my-2 border-t border-surface-muted" />}
            <div className="flex items-center justify-between">
              <span className="font-medium">{userName(c.userId)}</span>
              <span className="font-semibold">{formatCents(c.amountCents)}</span>
            </div>
          </div>
        ))}
      </Card>

      {/* Dépenses */}
      <SectionTitle>Dépenses associées</SectionTitle>
      <Card>
        {data.expenses.length === 0 ? (
          <EmptyState icon="🧾" title="Aucune dépense associée" />
        ) : (
          data.expenses.map((e, i) => (
            <div key={e.id}>
              {i > 0 && <div className="my-3 border-t border-surface-muted" />}
              <button
                type="button"
                onClick={() => setEditingExpenseId(e.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{merchantName(e.merchantId)}</p>
                  <p className="text-xs text-ink-muted">
                    {e.date} · {e.paymentSource === "meal_voucher" ? "Tickets resto" : "Compte commun"}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatCents(e.amountCents)}</p>
                <Chevron />
              </button>
            </div>
          ))
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-2 pt-2 pb-4">
        <button type="button" className="btn-ghost flex-1" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button type="button" className="btn-ghost flex-1" onClick={() => app.toggleBudget(budget.id)}>
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

      <Sheet
        open={editingExpenseId !== null}
        onClose={() => setEditingExpenseId(null)}
        title="Modifier la dépense"
      >
        {editingExpense && (
          <ExpenseForm expense={editingExpense} onDone={() => setEditingExpenseId(null)} />
        )}
      </Sheet>
    </div>
  );
}
