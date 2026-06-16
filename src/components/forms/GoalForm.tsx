"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Select, TextInput } from "@/components/ui/fields";
import { BudgetIcon } from "@/components/ui/BudgetIcon";
import { centsToInput, parseAmountToCents } from "@/lib/money";
import type { SavingsGoal } from "@/lib/types";

const ICONS = ["piggy-bank", "plane", "backpack", "home", "car", "heart", "star", "globe", "landmark", "wallet"];

export function GoalForm({ onDone, goal }: { onDone: () => void; goal?: SavingsGoal }) {
  const app = useAppState();
  const savingsBudgets = app.state.budgets.filter((b) => b.active && (b.type === "savings" || b.type === "annual"));

  const [name, setName] = useState(goal?.name ?? "");
  const [icon, setIcon] = useState(goal?.icon ?? "piggy-bank");
  const [target, setTarget] = useState(goal ? centsToInput(goal.targetCents) : "");
  const [current, setCurrent] = useState(goal ? centsToInput(goal.currentCents) : "0");
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "");
  const [budgetId, setBudgetId] = useState(goal?.budgetId ?? "");

  const targetCents = parseAmountToCents(target);
  const currentCents = parseAmountToCents(current);
  const canSave = name.trim() !== "" && targetCents > 0;

  function save() {
    if (!canSave) return;
    const fields = {
      name: name.trim(),
      icon,
      targetCents,
      currentCents,
      targetDate: targetDate || undefined,
      budgetId: budgetId || undefined,
    };
    if (goal) {
      app.updateGoal(goal.id, fields);
    } else {
      app.addGoal(fields);
    }
    onDone();
  }

  return (
    <div>
      <Field label="Nom">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Vacances, Voiture…" autoFocus />
      </Field>
      <Field label="Pictogramme">
        <div className="flex flex-wrap gap-2">
          {ICONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setIcon(n)}
              className={
                "flex h-10 w-10 items-center justify-center rounded-xl transition " +
                (icon === n ? "bg-brand-50 ring-2 ring-brand-600" : "bg-surface-subtle")
              }
            >
              <BudgetIcon name={n} size={20} color={icon === n ? "#13C8A0" : "#8e8e93"} />
            </button>
          ))}
        </div>
      </Field>
      <Field label="Objectif (montant cible)">
        <TextInput inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0,00 €" />
      </Field>
      <Field label="Déjà épargné">
        <TextInput inputMode="decimal" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0,00 €" />
      </Field>
      <Field label="Échéance (optionnelle)">
        <TextInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </Field>
      <Field label="Budget d'épargne associé (optionnel)">
        <Select value={budgetId} onChange={(e) => setBudgetId(e.target.value)}>
          <option value="">— Aucun —</option>
          {savingsBudgets.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
      </Field>
      <button type="button" className="btn-primary w-full" disabled={!canSave} onClick={save}>
        {goal ? "Enregistrer" : "Créer l'objectif"}
      </button>
    </div>
  );
}
