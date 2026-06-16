"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, Avatar, BudgetTile, Card, Chevron, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { Select, TextInput } from "@/components/ui/fields";
import { ExpenseSheet } from "@/components/expenses/ExpenseSheet";
import { contributionSummaries } from "@/lib/calc/dashboard";
import { activeBudgets } from "@/lib/calc/budget";
import { formatCents } from "@/lib/money";
import { formatDateLabel, todayIso } from "@/lib/date";

type Filter = "all" | "expense" | "income" | "contribution" | "provision" | "meal_voucher";

interface ActivityItem {
  id: string;
  kind: Exclude<Filter, "all">;
  date: string;
  title: string;
  subtitle: string;
  amountCents: number;
  badge: { label: string; color: string; bg: string };
  userId?: string;
  merchantId?: string;
  budgetId?: string;
  logoUrl?: string;
  search: string;
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

type Tab = "all" | "unclassified" | "expense" | "income" | "contribution";

const FILTERS: Array<{ value: Tab; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "unclassified", label: "À classer" },
  { value: "expense", label: "Dépenses" },
  { value: "income", label: "Revenus" },
  { value: "contribution", label: "Contributions" },
];

function dateBucket(date: string, today: string): string {
  if (date.slice(0, 10) === today) return "Aujourd'hui";
  const d = new Date(`${date.slice(0, 10)}T00:00:00`).getTime();
  const t = new Date(`${today}T00:00:00`).getTime();
  if (t - d === 86_400_000) return "Hier";
  const [y, m, dd] = date.slice(0, 10).split("-").map(Number);
  if (!y || !m || !dd) return date.slice(0, 10);
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(y, m - 1, dd),
  );
}

export default function ActivityPage() {
  const app = useAppState();
  const { state, currentMonth, activeUsers } = app;
  const [filter, setFilter] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [filterMerchant, setFilterMerchant] = useState("");
  const [filterBudget, setFilterBudget] = useState("");
  const [openExpenseId, setOpenExpenseId] = useState<string | null>(null);

  const userName = (id?: string) => state.users.find((u) => u.id === id)?.firstName ?? "—";
  const merchantName = (id?: string) => state.merchants.find((m) => m.id === id)?.name ?? "Sans enseigne";
  const budgetName = (id?: string) => state.budgets.find((b) => b.id === id)?.name ?? "Sans budget";

  const plannedExpenses = useMemo(
    () => state.expenses.filter((e) => e.planned).sort((a, b) => a.date.localeCompare(b.date)),
    [state.expenses],
  );

  const items = useMemo<ActivityItem[]>(() => {
    const monthExpenses = state.expenses.filter((e) => !e.planned && e.date.startsWith(currentMonth));
    const result: ActivityItem[] = [];

    for (const e of monthExpenses) {
      const isMeal = e.paymentSource === "meal_voucher";
      const kind: Exclude<Filter, "all"> = isMeal ? "meal_voucher" : "expense";
      const merchant = state.merchants.find((m) => m.id === e.merchantId);
      const title = merchant?.name ?? "Sans enseigne";
      const subtitle = `${budgetName(e.budgetId)} · ${userName(e.userId)}`;
      result.push({
        id: e.id,
        kind,
        date: e.date,
        title,
        subtitle,
        amountCents: -e.amountCents,
        badge: BADGE[kind],
        userId: e.userId,
        merchantId: e.merchantId,
        budgetId: e.budgetId,
        logoUrl: merchant?.logoUrl ?? merchant?.photoUrl,
        search: `${title} ${subtitle} ${(e.tags ?? []).join(" ")}`.toLowerCase(),
      });
    }

    for (const i of state.incomes.filter((x) => x.month === currentMonth)) {
      const title = `Revenus ${userName(i.userId)}`;
      result.push({
        id: i.id,
        kind: "income",
        date: i.declaredAt,
        title,
        subtitle: "Salaire + tickets restaurant",
        amountCents: i.salaryCents + i.mealVouchersCents,
        badge: BADGE.income,
        userId: i.userId,
        search: title.toLowerCase(),
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
        budgetId: p.budgetId,
        search: `${p.label} ${budgetName(p.budgetId)}`.toLowerCase(),
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
      const title = `Contribution ${userName(c.userId)}`;
      result.push({
        id: `contrib_${c.userId}`,
        kind: "contribution",
        date: `${currentMonth}-01`,
        title,
        subtitle: "Participation aux budgets du mois",
        amountCents: c.contributionTotalCents,
        badge: BADGE.contribution,
        userId: c.userId,
        search: title.toLowerCase(),
      });
    }

    return result.sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, currentMonth, activeUsers]);

  const q = search.trim().toLowerCase();
  const isExpenseKind = (k: ActivityItem["kind"]) => k === "expense" || k === "meal_voucher";
  const matchesTab = (it: ActivityItem) => {
    if (filter === "all") return true;
    if (filter === "unclassified") return isExpenseKind(it.kind) && !it.budgetId;
    if (filter === "expense") return isExpenseKind(it.kind);
    return it.kind === filter;
  };
  const filtered = items.filter(
    (it) =>
      matchesTab(it) &&
      (!filterUser || it.userId === filterUser) &&
      (!filterMerchant || it.merchantId === filterMerchant) &&
      (!filterBudget || it.budgetId === filterBudget) &&
      (!q || it.search.includes(q)),
  );

  // Regroupement par date (déjà trié décroissant).
  const today = todayIso();
  const groups: Array<{ label: string; items: ActivityItem[] }> = [];
  for (const it of filtered) {
    const label = dateBucket(it.date, today);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(it);
    else groups.push({ label, items: [it] });
  }

  const activeFilterCount = (filterUser ? 1 : 0) + (filterMerchant ? 1 : 0) + (filterBudget ? 1 : 0);

  return (
    <div className="space-y-1">
      <MonthSwitcher />

      {/* À venir */}
      {plannedExpenses.length > 0 && (
        <>
          <SectionTitle>À venir</SectionTitle>
          <Card>
            {plannedExpenses.map((e, i) => (
              <div key={e.id}>
                {i > 0 && <div className="my-3 border-t border-surface-muted" />}
                <button
                  type="button"
                  onClick={() => setOpenExpenseId(e.id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <BudgetTile icon="package" bg="#fff4e0" color="#ff9500" size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{merchantName(e.merchantId)}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {formatDateLabel(e.date)} · {budgetName(e.budgetId)}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-ink-muted">{formatCents(e.amountCents)}</p>
                  <Chevron />
                </button>
              </div>
            ))}
          </Card>
        </>
      )}

      {/* Recherche */}
      <div className="mt-3">
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un mouvement"
        />
      </div>

      {/* Filtres rapides par type */}
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
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

      {/* Filtres avancés */}
      <button
        type="button"
        onClick={() => setShowFilters((v) => !v)}
        className="px-1 text-sm font-medium text-brand-600"
      >
        {showFilters ? "Masquer les filtres" : "Filtres avancés"}
        {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
      </button>
      {showFilters && (
        <Card className="space-y-2">
          <Select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
            <option value="">Toutes les personnes</option>
            {state.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </Select>
          <Select value={filterMerchant} onChange={(e) => setFilterMerchant(e.target.value)}>
            <option value="">Toutes les enseignes</option>
            {state.merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          <Select value={filterBudget} onChange={(e) => setFilterBudget(e.target.value)}>
            <option value="">Tous les budgets</option>
            {state.budgets.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          {activeFilterCount > 0 && (
            <button
              type="button"
              className="btn-ghost w-full"
              onClick={() => {
                setFilterUser("");
                setFilterMerchant("");
                setFilterBudget("");
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </Card>
      )}

      {filtered.length === 0 ? (
        <div className="mt-2">
          <EmptyState icon="📋" title="Aucun mouvement" hint={q || activeFilterCount > 0 ? "Aucun résultat pour ces critères." : undefined} />
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label}>
            <SectionTitle>{group.label}</SectionTitle>
            <Card className="py-1">
              {group.items.map((item, i) => {
                const visual = KIND_VISUAL[item.kind];
                const editable = item.kind === "expense" || item.kind === "meal_voucher";
                const unclassified = editable && !item.budgetId;
                return (
                  <div key={item.id}>
                    {i > 0 && <div className="border-t border-surface-muted/70" />}
                    <button
                      type="button"
                      disabled={!editable}
                      onClick={editable ? () => setOpenExpenseId(item.id) : undefined}
                      className="flex w-full items-center gap-3 py-3 text-left disabled:cursor-default"
                    >
                      {item.logoUrl ? (
                        <Avatar name={item.title} src={item.logoUrl} size={40} />
                      ) : (
                        <BudgetTile icon={visual.icon} bg={visual.bg} color={visual.color} size={40} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="truncate text-xs text-ink-muted">{item.subtitle}</p>
                        {unclassified && (
                          <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-warn">
                            À classer
                          </span>
                        )}
                      </div>
                      <p
                        className="shrink-0 font-semibold"
                        style={{ color: item.amountCents >= 0 ? "#32D74B" : "rgb(var(--ink))" }}
                      >
                        <Amount cents={item.amountCents} sign />
                      </p>
                      {editable && <Chevron />}
                    </button>
                  </div>
                );
              })}
            </Card>
          </div>
        ))
      )}

      <ExpenseSheet expenseId={openExpenseId} onClose={() => setOpenExpenseId(null)} />
    </div>
  );
}
