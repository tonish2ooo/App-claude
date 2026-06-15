"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Segmented, Select, TextInput } from "@/components/ui/fields";
import { centsToInput, parseAmountToCents } from "@/lib/money";
import type { ExpensePaymentSource, RecurringExpense } from "@/lib/types";

export function RecurringForm({ onDone, recurring }: { onDone: () => void; recurring?: RecurringExpense }) {
  const app = useAppState();
  const { state, currentUser, activeUsers, currentMonth } = app;
  const activeBudgets = state.budgets.filter((b) => b.active);

  const [label, setLabel] = useState(recurring?.label ?? "");
  const [amount, setAmount] = useState(recurring ? centsToInput(recurring.amountCents) : "");
  const [budgetId, setBudgetId] = useState(recurring?.budgetId ?? activeBudgets[0]?.id ?? "");
  const [userId, setUserId] = useState(recurring?.userId ?? currentUser?.id ?? activeUsers[0]?.id ?? "");
  const [paymentSource, setPaymentSource] = useState<ExpensePaymentSource>(
    recurring?.paymentSource ?? "common_account",
  );
  const [dayOfMonth, setDayOfMonth] = useState(String(recurring?.dayOfMonth ?? 1));

  const amountCents = parseAmountToCents(amount);
  const canSave = label.trim() !== "" && amountCents > 0 && userId;

  function save() {
    if (!canSave) return;
    const day = Math.min(28, Math.max(1, Number(dayOfMonth) || 1));
    const fields = {
      label: label.trim(),
      amountCents,
      budgetId: budgetId || undefined,
      userId,
      paymentSource,
      splitRule: { mode: "prorata" as const },
      dayOfMonth: day,
    };
    if (recurring) {
      app.updateRecurring(recurring.id, fields);
    } else {
      app.addRecurring({ ...fields, startMonth: currentMonth, active: true });
    }
    onDone();
  }

  return (
    <div>
      <Field label="Libellé">
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Loyer, Netflix…" autoFocus />
      </Field>
      <Field label="Montant">
        <TextInput inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00 €" />
      </Field>
      <Field label="Budget associé">
        <Select value={budgetId} onChange={(e) => setBudgetId(e.target.value)}>
          <option value="">— Aucun —</option>
          {activeBudgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Payé par">
        <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Provenance">
        <Segmented
          value={paymentSource}
          onChange={(v) => setPaymentSource(v)}
          options={[
            { value: "common_account", label: "Compte commun" },
            { value: "meal_voucher", label: "Tickets resto" },
          ]}
        />
      </Field>
      <Field label="Jour du mois" hint="La dépense est créée automatiquement ce jour-là (1 à 28)">
        <TextInput
          inputMode="numeric"
          value={dayOfMonth}
          onChange={(e) => setDayOfMonth(e.target.value.replace(/\D/g, ""))}
        />
      </Field>
      <button type="button" className="btn-primary w-full" disabled={!canSave} onClick={save}>
        {recurring ? "Enregistrer" : "Créer l'abonnement"}
      </button>
    </div>
  );
}
