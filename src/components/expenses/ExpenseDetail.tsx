"use client";

import type { ReactNode } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Amount, BudgetTile, Pill } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { splitAmount } from "@/lib/calc/contributions";
import { formatCents } from "@/lib/money";
import { formatDateLabel } from "@/lib/date";
import type { Expense } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = {
  manual: "Saisie manuelle",
  bank: "Synchronisation bancaire",
  import: "Import",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-surface-muted py-2.5 first:border-t-0">
      <span className="shrink-0 text-sm text-ink-muted">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

/** Fiche détail (lecture seule) d'une dépense, avec actions Modifier / Supprimer. */
export function ExpenseDetail({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const app = useAppState();
  const { state, activeUsers } = app;

  const merchant = state.merchants.find((m) => m.id === expense.merchantId);
  const budget = state.budgets.find((b) => b.id === expense.budgetId);
  const userName = (id?: string) => state.users.find((u) => u.id === id)?.firstName ?? "—";
  const month = expense.date.slice(0, 7);
  const shares = splitAmount(expense.amountCents, expense.splitRule, activeUsers, state.incomes, month);
  const isMeal = expense.paymentSource === "meal_voucher";
  const tile = budget ? tileColorFor(budget.id) : { bg: "#f2f2f7", bar: "#8e8e93" };

  function remove() {
    if (typeof window !== "undefined" && !window.confirm("Supprimer cette dépense ?")) return;
    app.removeExpense(expense.id);
    onDelete();
  }

  return (
    <div>
      {/* En-tête : montant + enseigne + date */}
      <div className="flex items-center gap-3">
        <BudgetTile icon={budget?.icon ?? "package"} bg={tile.bg} color={tile.bar} size={52} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{merchant?.name ?? "Sans enseigne"}</p>
          <p className="text-xs text-ink-muted">{formatDateLabel(expense.date)}</p>
        </div>
        <p className="shrink-0 text-2xl font-bold tracking-tight">{formatCents(expense.amountCents)}</p>
      </div>

      <div className="mt-3 rounded-2xl bg-surface-subtle px-3.5">
        <Row label="Montant">{formatCents(expense.amountCents)}</Row>
        <Row label="Date">{formatDateLabel(expense.date)}</Row>
        <Row label="Enseigne">
          {merchant ? (
            <span>
              {merchant.name}
              <span className="block text-xs font-normal text-ink-muted">{merchant.category}</span>
            </span>
          ) : (
            "Sans enseigne"
          )}
        </Row>
        <Row label="Budget">
          {budget ? (
            <span className="inline-flex items-center gap-2">
              <BudgetTile icon={budget.icon} bg={tile.bg} color={tile.bar} size={22} />
              {budget.name}
            </span>
          ) : (
            "Aucun"
          )}
        </Row>
        <Row label="Payé par">{userName(expense.userId)}</Row>
        <Row label="Provenance">
          {isMeal ? (
            <Pill tone="warn">Tickets restaurant{expense.mealVoucherUserId ? ` · ${userName(expense.mealVoucherUserId)}` : ""}</Pill>
          ) : (
            <Pill tone="neutral">Compte commun</Pill>
          )}
        </Row>
        <Row label="Répartition">
          {expense.splitRule.mode === "prorata" ? "Au prorata des revenus" : "Personnalisée"}
        </Row>
        {expense.note && <Row label="Note">{expense.note}</Row>}
        <Row label="Origine">{SOURCE_LABEL[expense.source] ?? expense.source}</Row>
      </div>

      {/* Détail de la répartition par personne */}
      {shares.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 px-1 text-[13px] font-semibold uppercase tracking-wider text-ink-muted">
            Part de chacun
          </p>
          <div className="rounded-2xl bg-surface-subtle px-3.5">
            {shares.map((s) => (
              <Row key={s.userId} label={userName(s.userId)}>
                {formatCents(s.amountCents)}
              </Row>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button type="button" className="btn-primary flex-1" onClick={onEdit}>
          Modifier
        </button>
        <button type="button" className="btn-danger flex-1" onClick={remove}>
          Supprimer
        </button>
      </div>
    </div>
  );
}
