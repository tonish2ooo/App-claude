"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { MonthSwitcher } from "@/components/layout/MonthSwitcher";
import { Amount, Card, EmptyState, Pill } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { householdIncomeTotalCents, incomeSharePct } from "@/lib/calc/income";
import { formatCents } from "@/lib/money";

export default function AdminIncomesPage() {
  const app = useAppState();
  const { state, currentMonth, activeUsers } = app;
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const total = useMemo(
    () => householdIncomeTotalCents(state.incomes, activeUsers, currentMonth),
    [state.incomes, activeUsers, currentMonth],
  );

  return (
    <div className="space-y-3">
      <AdminHeader
        title="Revenus mensuels"
        action={
          <button
            type="button"
            className="text-xs font-semibold text-brand-600"
            onClick={() => app.duplicatePreviousMonthIncomes(currentMonth)}
          >
            Dupliquer M-1
          </button>
        }
      />
      <MonthSwitcher />

      <Card className="bg-brand-600 text-white">
        <p className="text-sm text-brand-100">Revenu total du foyer</p>
        <p className="text-2xl font-bold">
          <Amount cents={total} />
        </p>
      </Card>

      <div className="space-y-2">
        {activeUsers.map((u) => {
          const income = state.incomes.find((i) => i.userId === u.id && i.month === currentMonth);
          const share = incomeSharePct(state.incomes, activeUsers, u.id, currentMonth);
          return (
            <Card key={u.id} onClick={() => setEditUserId(u.id)}>
              <div className="flex items-center justify-between">
                <p className="font-medium">{u.firstName} {u.lastName}</p>
                {income ? (
                  <Pill tone="ok">{Math.round(share * 100)} %</Pill>
                ) : (
                  <Pill tone="warn">À déclarer</Pill>
                )}
              </div>
              {income ? (
                <div className="mt-2 flex justify-between text-sm text-ink-soft">
                  <span>Salaire {formatCents(income.salaryCents)}</span>
                  <span>TR {formatCents(income.mealVouchersCents)}</span>
                  <span className="font-semibold text-ink">
                    {formatCents(income.salaryCents + income.mealVouchersCents)}
                  </span>
                </div>
              ) : (
                <p className="mt-1 text-xs text-warn">Revenus non déclarés ce mois</p>
              )}
            </Card>
          );
        })}
        {activeUsers.length === 0 && <EmptyState icon="👥" title="Aucun utilisateur actif" />}
      </div>

      <Sheet open={editUserId !== null} onClose={() => setEditUserId(null)} title="Revenus du mois">
        {editUserId !== null && (
          <IncomeForm onDone={() => setEditUserId(null)} defaultUserId={editUserId} month={currentMonth} />
        )}
      </Sheet>
    </div>
  );
}
