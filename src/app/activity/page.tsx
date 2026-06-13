"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, Card, EmptyState, Pill } from "@/components/ui/primitives";
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
  badge: { label: string; tone: "neutral" | "brand" | "ok" | "warn" | "danger" };
}

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

  const userName = (id: string) => state.users.find((u) => u.id === id)?.firstName ?? "—";
  const merchantName = (id?: string) => state.merchants.find((m) => m.id === id)?.name ?? "Sans enseigne";
  const budgetName = (id?: string) => state.budgets.find((b) => b.id === id)?.name ?? "Sans budget";

  const items = useMemo<ActivityItem[]>(() => {
    const monthExpenses = state.expenses.filter((e) => e.date.startsWith(currentMonth));
    const result: ActivityItem[] = [];

    for (const e of monthExpenses) {
      const isMeal = e.paymentSource === "meal_voucher";
      result.push({
        id: e.id,
        kind: isMeal ? "meal_voucher" : "expense",
        date: e.date,
        title: merchantName(e.merchantId),
        subtitle: `${budgetName(e.budgetId)} · ${userName(e.userId)}`,
        amountCents: -e.amountCents,
        badge: isMeal
          ? { label: "Tickets resto", tone: "warn" }
          : { label: "Dépense bancaire", tone: "neutral" },
      });
    }

    for (const i of state.incomes.filter((x) => x.month === currentMonth)) {
      result.push({
        id: i.id,
        kind: "income",
        date: i.declaredAt,
        title: `Revenus ${userName(i.userId)}`,
        subtitle: `Salaire + tickets restaurant`,
        amountCents: i.salaryCents + i.mealVouchersCents,
        badge: { label: "Revenu", tone: "ok" },
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
        badge: { label: "Provision", tone: "brand" },
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
        badge: { label: "Contribution", tone: "brand" },
      });
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentMonth, activeUsers]);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-3">
      <MonthSwitcher />

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (filter === f.value ? "bg-brand-600 text-white" : "bg-surface text-ink-soft shadow-card")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{item.title}</p>
                <p className="truncate text-xs text-ink-muted">{item.subtitle}</p>
                <div className="mt-1">
                  <Pill tone={item.badge.tone}>{item.badge.label}</Pill>
                </div>
              </div>
              <p className={"shrink-0 font-semibold " + (item.amountCents >= 0 ? "text-ok" : "text-ink")}>
                <Amount cents={item.amountCents} sign />
              </p>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <EmptyState icon="📋" title="Aucune activité" />}
      </div>
    </div>
  );
}
