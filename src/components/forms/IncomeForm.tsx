"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";
import { centsToInput, parseAmountToCents } from "@/lib/money";
import type { Month } from "@/lib/types";

export function IncomeForm({
  onDone,
  defaultUserId,
  month,
}: {
  onDone: () => void;
  defaultUserId?: string;
  month?: Month;
}) {
  const app = useAppState();
  const { activeUsers, currentUser, currentMonth, state } = app;
  const targetMonth = month ?? currentMonth;

  const [userId, setUserId] = useState(defaultUserId ?? currentUser?.id ?? activeUsers[0]?.id ?? "");
  const existing = state.incomes.find((i) => i.userId === userId && i.month === targetMonth);

  const [salary, setSalary] = useState(existing ? centsToInput(existing.salaryCents) : "");
  const [meal, setMeal] = useState(existing ? centsToInput(existing.mealVouchersCents) : "");
  const [notes, setNotes] = useState(existing?.notes ?? "");

  function onUserChange(id: string) {
    setUserId(id);
    const found = state.incomes.find((i) => i.userId === id && i.month === targetMonth);
    setSalary(found ? centsToInput(found.salaryCents) : "");
    setMeal(found ? centsToInput(found.mealVouchersCents) : "");
    setNotes(found?.notes ?? "");
  }

  function save() {
    app.upsertIncome({
      userId,
      month: targetMonth,
      salaryCents: parseAmountToCents(salary),
      mealVouchersCents: parseAmountToCents(meal),
      notes: notes.trim() || undefined,
    });
    onDone();
  }

  return (
    <div>
      <Field label="Utilisateur">
        <Select value={userId} onChange={(e) => onUserChange(e.target.value)}>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Mois">
        <TextInput value={targetMonth} readOnly />
      </Field>
      <Field label="Salaire">
        <TextInput
          inputMode="decimal"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="0,00 €"
        />
      </Field>
      <Field label="Tickets restaurant">
        <TextInput
          inputMode="decimal"
          value={meal}
          onChange={(e) => setMeal(e.target.value)}
          placeholder="0,00 €"
        />
      </Field>
      <Field label="Notes (optionnelles)">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <button type="button" className="btn-primary w-full" disabled={!userId} onClick={save}>
        Enregistrer les revenus
      </button>
    </div>
  );
}
