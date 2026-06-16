"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, BudgetTile, Card, Chevron, EmptyState, RingProgress, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import type { BudgetType } from "@/lib/types";
import { Sheet } from "@/components/ui/Sheet";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { GoalForm } from "@/components/forms/GoalForm";
import { BudgetIcon } from "@/components/ui/BudgetIcon";
import { budgetProgressForMonth, budgetTotalForMonth } from "@/lib/calc/dashboard";
import { goalProgress } from "@/lib/calc/goals";
import { formatCents } from "@/lib/money";
import { todayIso } from "@/lib/date";
import type { SavingsGoal } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  monthly: "Mensuel",
  annual: "Annuel",
  savings: "Épargne",
};

export default function BudgetsPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | BudgetType>("all");
  const [goalCreating, setGoalCreating] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const today = todayIso();

  const progress = useMemo(
    () => budgetProgressForMonth(state.budgets, state.expenses, currentMonth),
    [state.budgets, state.expenses, currentMonth],
  );
  const total = budgetTotalForMonth(state.budgets, currentMonth);

  const sorted = [...state.budgets].sort((a, b) => a.order - b.order);
  const filtered = filter === "all" ? sorted : sorted.filter((b) => b.type === filter);

  const TABS: Array<{ value: "all" | BudgetType; label: string }> = [
    { value: "all", label: "Tous" },
    { value: "monthly", label: "Mensuels" },
    { value: "annual", label: "Annuels" },
    { value: "savings", label: "Épargne" },
  ];

  const totalSpent = progress.reduce((s, p) => s + p.spentCents, 0);
  const globalPct = total > 0 ? totalSpent / total : 0;
  const globalColor = globalPct > 1 ? "#ff3b30" : globalPct >= 0.75 ? "#ff9500" : "#007aff";

  return (
    <div className="space-y-1">
      <MonthSwitcher />

      {/* Summary ring card */}
      <div className="mt-3">
        <Card>
          <div className="flex items-center gap-4">
            <RingProgress progress={globalPct} size={72} stroke={7} color={globalColor}>
              <span className="text-[11px] font-semibold text-ink-muted">
                {Math.round(globalPct * 100)}%
              </span>
            </RingProgress>
            <div className="flex-1">
              <p className="text-[13px] text-ink-muted">Budget total du mois</p>
              <p className="mt-0.5 text-[28px] font-bold leading-none tracking-tight">
                <Amount cents={total} />
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {formatCents(totalSpent)} dépensés
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setFilter(t.value)}
            className={
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition " +
              (filter === t.value
                ? "bg-brand-600 text-white"
                : "bg-surface text-ink-muted shadow-card")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <SectionTitle
        action={
          <button type="button" onClick={() => setCreating(true)}>
            + Nouveau
          </button>
        }
      >
        {filter === "all" ? "Tous les budgets" : TABS.find((t) => t.value === filter)?.label}
      </SectionTitle>

      {state.budgets.length === 0 && (
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={() => app.loadPresetBudgets()}
        >
          Charger la liste de budgets par défaut
        </button>
      )}

      <Card>
        {filtered.length === 0 ? (
          <EmptyState icon="📊" title="Aucun budget" hint="Créez votre premier budget." />
        ) : (
          filtered.map((budget, i) => {
            const p = progress.find((x) => x.budgetId === budget.id);
            const color = tileColorFor(budget.id);
            const pct = p ? p.progress : 0;
            const status = pct > 1 ? "over" : pct >= 0.75 ? "warning" : "normal";
            const ringC = !budget.active
              ? "#c7c7cc"
              : status === "over"
              ? "#ff3b30"
              : status === "warning"
              ? "#ff9500"
              : color.bar;

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
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{budget.name}</p>
                      {!budget.active && (
                        <span className="shrink-0 rounded-full bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                          Inactif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted">
                      {TYPE_LABEL[budget.type]}
                      {p && budget.active ? ` · ${formatCents(p.spentCents)} / ${formatCents(p.plannedMonthlyCents)}` : ""}
                    </p>
                  </div>
                  {budget.active && p ? (
                    <RingProgress progress={pct} size={38} stroke={3.5} color={ringC}>
                      <span className="text-[9px] font-bold" style={{ color: ringC }}>
                        {Math.round(pct * 100)}%
                      </span>
                    </RingProgress>
                  ) : (
                    <div className="h-9 w-9" />
                  )}
                  <Chevron />
                </button>
              </div>
            );
          })
        )}
      </Card>

      {/* Objectifs d'épargne */}
      <SectionTitle
        action={
          <button type="button" onClick={() => setGoalCreating(true)}>
            + Objectif
          </button>
        }
      >
        Objectifs d'épargne
      </SectionTitle>
      <div className="space-y-2">
        {state.savingsGoals.length === 0 ? (
          <EmptyState icon="🎯" title="Aucun objectif" hint="Fixez un montant à atteindre (vacances, projet…)." />
        ) : (
          state.savingsGoals.map((g) => {
            const p = goalProgress(g, today);
            const color = p.reached ? "#34c759" : "#007aff";
            return (
              <Card key={g.id} onClick={() => setEditingGoal(g)}>
                <div className="flex items-center gap-3">
                  <RingProgress progress={Math.min(1, p.pct)} size={48} stroke={5} color={color}>
                    <span className="text-[9px] font-bold" style={{ color }}>
                      {Math.round(p.pct * 100)}%
                    </span>
                  </RingProgress>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <BudgetIcon name={g.icon} size={16} color={color} />
                      <p className="truncate font-medium">{g.name}</p>
                    </div>
                    <p className="text-xs text-ink-muted">
                      {formatCents(g.currentCents)} / {formatCents(g.targetCents)}
                      {p.reached
                        ? " · atteint 🎉"
                        : p.perMonthCents !== null
                        ? ` · ${formatCents(p.perMonthCents)}/mois`
                        : ` · reste ${formatCents(p.remainingCents)}`}
                    </p>
                  </div>
                  <Chevron />
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title="Nouveau budget">
        <BudgetForm onDone={() => setCreating(false)} />
      </Sheet>

      <Sheet open={goalCreating} onClose={() => setGoalCreating(false)} title="Nouvel objectif d'épargne">
        <GoalForm onDone={() => setGoalCreating(false)} />
      </Sheet>

      <Sheet open={editingGoal !== null} onClose={() => setEditingGoal(null)} title="Modifier l'objectif">
        {editingGoal && (
          <div>
            <GoalForm goal={editingGoal} onDone={() => setEditingGoal(null)} />
            <button
              type="button"
              className="btn-danger mt-3 w-full"
              onClick={() => {
                app.removeGoal(editingGoal.id);
                setEditingGoal(null);
              }}
            >
              Supprimer l'objectif
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
