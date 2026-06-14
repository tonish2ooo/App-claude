"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Field, Segmented, TextArea, TextInput } from "@/components/ui/fields";
import { SplitEditor } from "@/components/forms/SplitEditor";
import { BudgetIcon } from "@/components/ui/BudgetIcon";
import { centsToInput, formatCents, parseAmountToCents } from "@/lib/money";
import type { Budget, BudgetSplitRule, BudgetType } from "@/lib/types";

const ICONS = [
  "home", "shield", "bank", "cart", "utensils", "knife",
  "car", "zap", "droplet", "cup", "backpack", "dumbbell",
  "wifi", "ev-plug", "lock", "shirt", "package", "star",
  "heart", "globe", "coffee", "plane", "wallet", "medical",
  "piggy-bank", "landmark",
];

export function BudgetForm({ onDone, budget }: { onDone: () => void; budget?: Budget }) {
  const app = useAppState();
  const { activeUsers, state } = app;

  const [name, setName] = useState(budget?.name ?? "");
  const [amount, setAmount] = useState(budget ? centsToInput(budget.amountCents) : "");
  const [type, setType] = useState<BudgetType>(budget?.type ?? "monthly");
  const [icon, setIcon] = useState(budget?.icon ?? "package");
  const [rule, setRule] = useState<BudgetSplitRule>(budget?.splitRule ?? { mode: "prorata" });
  const [notes, setNotes] = useState(budget?.notes ?? "");

  const amountCents = parseAmountToCents(amount);
  const splitValid =
    rule.mode === "prorata" ||
    (rule.shares ?? []).reduce((acc, s) => acc + s.percent, 0) === 100;
  const canSave = name.trim() !== "" && amountCents > 0 && splitValid;

  function save() {
    if (!canSave) return;
    if (budget) {
      app.updateBudget(budget.id, { name: name.trim(), amountCents, type, icon, splitRule: rule, notes: notes.trim() || undefined });
    } else {
      const maxOrder = state.budgets.reduce((m, b) => Math.max(m, b.order), 0);
      app.addBudget({
        name: name.trim(),
        amountCents,
        type,
        icon,
        active: true,
        order: maxOrder + 1,
        splitRule: rule,
        notes: notes.trim() || undefined,
      });
    }
    onDone();
  }

  return (
    <div>
      <Field label="Nom du budget">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Courses, Loyer…" autoFocus />
      </Field>

      <Field label="Pictogramme">
        <div className="flex flex-wrap gap-2">
          {ICONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              className={
                "flex h-10 w-10 items-center justify-center rounded-xl transition " +
                (icon === name
                  ? "bg-brand-50 ring-2 ring-brand-600"
                  : "bg-surface-subtle")
              }
            >
              <BudgetIcon
                name={name}
                size={20}
                color={icon === name ? "#007aff" : "#8e8e93"}
              />
            </button>
          ))}
        </div>
      </Field>

      <Field label="Type">
        <Segmented
          value={type}
          onChange={(v) => setType(v)}
          options={[
            { value: "monthly", label: "Mensuel" },
            { value: "annual", label: "Annuel" },
            { value: "savings", label: "Épargne" },
          ]}
        />
      </Field>

      <Field
        label={type === "annual" ? "Montant annuel" : type === "savings" ? "Épargne mensuelle" : "Montant mensuel"}
        hint={
          type === "annual" && amountCents > 0
            ? `Provision mensuelle ≈ ${formatCents(Math.round(amountCents / 12))}`
            : undefined
        }
      >
        <TextInput
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0,00 €"
        />
      </Field>

      <div className="mb-3">
        <span className="field-label">Répartition</span>
        <SplitEditor rule={rule} users={activeUsers} onChange={setRule} />
      </div>

      <Field label="Notes (optionnelles)">
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <button type="button" className="btn-primary w-full" disabled={!canSave} onClick={save}>
        {budget ? "Enregistrer" : "Créer le budget"}
      </button>
    </div>
  );
}
