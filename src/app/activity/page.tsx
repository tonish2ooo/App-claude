"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, BudgetTile, Card, Chevron, EmptyState } from "@/components/ui/primitives";
import { ExpenseSheet } from "@/components/expenses/ExpenseSheet";
import { contributionSummaries } from "@/lib/calc/dashboard";
import { activeBudgets } from "@/lib/calc/budget";

type Filter = "all" | "expense" | "income" | "contribution" | "provision" | "meal_voucher";

interface ActivityItem {
  id: string;
  kind: Exclude<Filter, "all">;
  date: string;
  title: string;
  subtitle: string;
  amountCents: number;
  badge: { label: string; color: string; bg: string };
}

const KIND_VISUAL: Record<Exclude<Filter, "all">, { icon: string; bg: string; color: string }> = {
  expense:      { icon: "package",  bg: "#f2f2f7", color: "#8e8e93" },
  income:       { icon: "wallet",   bg: "#e8faf0", color: "#34c759" },
  contribution: { icon: "heart",    bg: "#f0eeff", color: "#5856d6" },
  provision:    { icon: "bank",     bg: "#fff4e0", color: "#ff9500" },
  meal_voucher: { icon: "utensils", bg: "#e4f5fb", color: "#32ade6" },
};

const BADGE: Record<Exclude<Filter, "all">, { label: string; color: string; bg: string }> = {
  expense: { label: "Dépense", color: "#3c3c43", bg: "#e5e5ea" },
  income: { label: "Revenu", color: "#34c759", bg: "#e8faf0" },
  contribution: { label: "Contribution", color: "#5856d6", bg: "#f0eeff" },
  provision: { label: "Provision", color: "#ff9500", bg: "#fff4e0" },
  meal_voucher: { label: "Tickets resto", color: "#32ade6", bg: "#e4f5fb" },
};

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "expense", label: "Dépenses" },
  { value: "income", label: "Revenus" },
  { value: "contribution", label: "Contributions" },
  { value: "provision", label: "Provisions" },
  { value: "meal_voucher", label: "Tickets resto" },
];

export default function ActivityPage() {
  const app = useAppState();
  const { state, currentMonth, activeUsers } = app;
  const [filter, setFilter] = useState<Filter>("all");
  const [openExpenseId, setOpenExpenseId] = useState<string | null>(null);

  const userName = (id: string) => state.users.find((u) => u.id === id)?.firstName ?? "—";
  const merchantName = (id?: string) => state.merchants.find((m) => m.id === id)?.name ?? "Sans enseigne";
  const budgetName = (id?: string) => state.budgets.find((b) => b.id === id)?.name ?? "Sans budget";

  const items = useMemo<ActivityItem[]>(() => {
    const monthExpenses = state.expenses.filter((e) => e.date.startsWith(currentMonth));
    const result: ActivityItem[] = [];

    for (const e of monthExpenses) {
      const isMeal = e.paymentSource === "meal_voucher";
      const kind: Exclude<Filter, "all"> = isMeal ? "meal_voucher" : "expense";
      result.push({
        id: e.id,
        kind,
        date: e.date,
        title: merchantName(e.merchantId),
        subtitle: `${budgetName(e.budgetId)} · ${userName(e.userId)}`,
        amountCents: -e.amountCents,
        badge: BADGE[kind],
      });
    }

    for (const i of state.incomes.filter((x) => x.month === currentMonth)) {
      result.push({
        id: i.id,
        kind: "income",
        date: i.declaredAt,
        title: `Revenus ${userName(i.userId)}`,
        subtitle: "Salaire + tickets restaurant",
        amountCents: i.salaryCents + i.mealVouchersCents,
        badge: BADGE.income,
      });
    }

    for (const p of state.provisions.filter((x) => x.month === currentMonth && x.status === "active")) {
      result.push({
        id: p.id,
        kind: "provision",
        date: `${p.month}-01`,
        title: p.label,
        subtitle: "Mise de côté mensuelle",
        amountCents: -p.amountCents,
        badge: BADGE.provision,
      });
    }

    const summaries = contributionSummaries(
      activeBudgets(state.budgets),
      activeUsers,
      state.incomes,
      state.expenses,
      currentMonth,
    );
    for (const c of summaries) {
      result.push({
        id: `contrib_${c.userId}`,
        kind: "contribution",
        date: `${currentMonth}-01`,
        title: `Contribution ${userName(c.userId)}`,
        subtitle: "Participation aux budgets du mois",
        amountCents: c.contributionTotalCents,
        badge: BADGE.contribution,
      });
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentMonth, activeUsers]);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-1">
      <MonthSwitcher />

      <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (filter === f.value ? "bg-brand-600 text-white" : "bg-surface text-ink-muted shadow-card")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {filtered.length === 0 ? (
          <EmptyState icon="📋" title="Aucune activité" />
        ) : (
          <Card>
            {filtered.map((item, i) => {
              const visual = KIND_VISUAL[item.kind];
              const editable = item.kind === "expense" || item.kind === "meal_voucher";
              return (
                <div key={item.id}>
                  {i > 0 && <div className="my-3 border-t border-surface-muted" />}
                  <button
                    type="button"
                    disabled={!editable}
                    onClick={editable ? () => setOpenExpenseId(item.id) : undefined}
                    className="flex w-full items-center gap-3 text-left disabled:cursor-default"
                  >
                    <BudgetTile icon={visual.icon} bg={visual.bg} color={visual.color} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="truncate text-xs text-ink-muted">{item.subtitle}</p>
                      <span
                        className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: item.badge.bg, color: item.badge.color }}
                      >
                        {item.badge.label}
                      </span>
                    </div>
                    <p
                      className="shrink-0 font-semibold"
                      style={{ color: item.amountCents >= 0 ? "#34c759" : "#000" }}
                    >
                      <Amount cents={item.amountCents} sign />
                    </p>
                    {editable && <Chevron />}
                  </button>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      <ExpenseSheet expenseId={openExpenseId} onClose={() => setOpenExpenseId(null)} />
    </div>
  );
}
