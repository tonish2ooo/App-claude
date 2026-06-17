"use client";

import { useMemo } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Card } from "@/components/ui/primitives";
import { formatCents } from "@/lib/money";
import { formatDateLabel } from "@/lib/date";

/**
 * File des transactions bancaires importées à rapprocher. Un débit peut être
 * transformé en dépense (sans budget → il rejoint « À traiter » pour catégorisation).
 */
export function BankReconcile() {
  const app = useAppState();
  const { state, currentUser, activeUsers } = app;

  const pending = useMemo(
    () => state.bankTransactions.filter((t) => t.status === "pending").sort((a, b) => b.date.localeCompare(a.date)),
    [state.bankTransactions],
  );

  if (pending.length === 0) return null;

  function importAsExpense(txId: string, amountCents: number, date: string, label: string) {
    const userId = currentUser?.id ?? activeUsers[0]?.id ?? "";
    const created = app.addExpense({
      userId,
      amountCents: Math.abs(amountCents),
      currency: state.household.defaultCurrency,
      paymentSource: "common_account",
      splitRule: { mode: "prorata" },
      date,
      note: label,
      source: "bank",
      planned: false,
    });
    app.resolveBankTransaction(txId, "imported", created.id);
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">À rapprocher</p>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-warn">{pending.length}</span>
      </div>
      <p className="text-xs text-ink-muted">
        Transactions importées de la banque. Validez-les en dépenses ou ignorez-les.
      </p>

      <div className="space-y-2">
        {pending.map((t) => {
          const debit = t.amountCents < 0;
          return (
            <div key={t.id} className="rounded-xl bg-surface-subtle p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.label}</p>
                  <p className="text-[11px] text-ink-muted">{formatDateLabel(t.date)}</p>
                </div>
                <p
                  className="shrink-0 text-sm font-semibold"
                  style={{ color: debit ? "rgb(var(--ink))" : "#32D74B" }}
                >
                  {debit ? "" : "+"}
                  {formatCents(Math.abs(t.amountCents))}
                </p>
              </div>
              <div className="mt-2 flex gap-2">
                {debit && (
                  <button
                    type="button"
                    className="flex-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-[0.98]"
                    onClick={() => importAsExpense(t.id, t.amountCents, t.date, t.label)}
                  >
                    Créer la dépense
                  </button>
                )}
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink-muted transition active:scale-[0.98]"
                  onClick={() => app.resolveBankTransaction(t.id, "dismissed")}
                >
                  Ignorer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
