"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Segmented, Select, TextArea, TextInput } from "@/components/ui/fields";
import { SplitEditor } from "@/components/forms/SplitEditor";
import { parseAmountToCents } from "@/lib/money";
import { todayIso } from "@/lib/date";
import type { BudgetSplitRule, Expense, ExpensePaymentSource } from "@/lib/types";

export function ExpenseForm({ onDone }: { onDone: () => void }) {
  const app = useAppState();
  const { state, currentUser, activeUsers, currentMonth } = app;
  const incomeComplete = state.incomes.some((i) => i.month === currentMonth);

  const [merchantId, setMerchantId] = useState<string>(state.merchants[0]?.id ?? "");
  const [newMerchant, setNewMerchant] = useState("");
  const [userId, setUserId] = useState(currentUser?.id ?? activeUsers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [paymentSource, setPaymentSource] = useState<ExpensePaymentSource>("common_account");
  const [mealVoucherUserId, setMealVoucherUserId] = useState(currentUser?.id ?? "");
  const [rule, setRule] = useState<BudgetSplitRule>({ mode: "prorata" });
  const [date, setDate] = useState(todayIso());
  const [budgetId, setBudgetId] = useState(state.budgets.find((b) => b.active)?.id ?? "");
  const [note, setNote] = useState("");

  const amountCents = parseAmountToCents(amount);
  const splitValid =
    rule.mode === "prorata" ||
    (rule.shares ?? []).reduce((acc, s) => acc + s.percent, 0) === 100;
  const canSave = amountCents > 0 && userId && splitValid;

  function save() {
    if (!canSave) return;
    let finalMerchantId = merchantId;
    if (newMerchant.trim()) {
      const created = app.addMerchant({
        name: newMerchant.trim(),
        category: "autre",
        active: true,
      });
      finalMerchantId = created.id;
    }
    const expense: Omit<Expense, "id" | "householdId" | "createdAt" | "updatedAt"> = {
      merchantId: finalMerchantId || undefined,
      userId,
      amountCents,
      currency: state.household.defaultCurrency,
      paymentSource,
      mealVoucherUserId: paymentSource === "meal_voucher" ? mealVoucherUserId : undefined,
      splitRule: rule,
      date,
      budgetId: budgetId || undefined,
      note: note.trim() || undefined,
      source: "manual",
    };
    app.addExpense(expense);
    onDone();
  }

  return (
    <div>
      {!incomeComplete && rule.mode === "prorata" && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-warn">
          Les revenus du mois ne sont pas déclarés : la répartition au prorata peut être imprécise.
        </p>
      )}

      <Field label="Enseigne">
        <Select value={merchantId} onChange={(e) => setMerchantId(e.target.value)}>
          <option value="">— Choisir —</option>
          {state.merchants.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Ou nouvelle enseigne" hint="Laisser vide pour utiliser l'enseigne ci-dessus">
        <TextInput
          value={newMerchant}
          onChange={(e) => setNewMerchant(e.target.value)}
          placeholder="Nom de la nouvelle enseigne"
        />
      </Field>

      <Field label="Montant">
        <TextInput
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00 €"
          autoFocus
        />
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

      {paymentSource === "meal_voucher" && (
        <Field label="Tickets restaurant de">
          <Select value={mealVoucherUserId} onChange={(e) => setMealVoucherUserId(e.target.value)}>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Budget associé">
        <Select value={budgetId} onChange={(e) => setBudgetId(e.target.value)}>
          <option value="">— Aucun —</option>
          {state.budgets
            .filter((b) => b.active)
            .map((b) => (
              <option key={b.id} value={b.id}>
                {b.icon} {b.name}
              </option>
            ))}
        </Select>
      </Field>

      <Field label="Date">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>

      <div className="mb-3">
        <span className="field-label">Répartition</span>
        <SplitEditor rule={rule} users={activeUsers} onChange={setRule} />
      </div>

      <Field label="Note (optionnelle)">
        <TextArea value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>

      <button type="button" className="btn-primary w-full" disabled={!canSave} onClick={save}>
        Ajouter la dépense
      </button>
    </div>
  );
}
