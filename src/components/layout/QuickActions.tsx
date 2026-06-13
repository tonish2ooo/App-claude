"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { MerchantForm } from "@/components/forms/MerchantForm";
import { UserForm } from "@/components/forms/UserForm";

type Action = "menu" | "expense" | "income" | "budget" | "merchant" | "user" | null;

const ITEMS: Array<{ key: Action; label: string; icon: string; primary?: boolean }> = [
  { key: "expense", label: "Ajouter une dépense", icon: "🧾", primary: true },
  { key: "income", label: "Ajouter un revenu", icon: "💶" },
  { key: "budget", label: "Ajouter un budget", icon: "📊" },
  { key: "merchant", label: "Ajouter une enseigne", icon: "🏬" },
  { key: "user", label: "Ajouter un utilisateur", icon: "👤" },
];

const TITLES: Record<string, string> = {
  expense: "Ajouter une dépense",
  income: "Déclarer un revenu",
  budget: "Nouveau budget",
  merchant: "Nouvelle enseigne",
  user: "Nouvel utilisateur",
};

export function QuickActions() {
  const [action, setAction] = useState<Action>(null);
  const close = () => setAction(null);

  return (
    <>
      <button
        type="button"
        aria-label="Actions rapides"
        onClick={() => setAction("menu")}
        className="fixed bottom-7 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-3xl font-light text-white shadow-fab ring-4 ring-surface transition active:scale-95"
      >
        +
      </button>

      <Sheet open={action === "menu"} onClose={close} title="Que voulez-vous ajouter ?">
        <div className="space-y-2">
          {ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setAction(item.key)}
              className={
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition " +
                (item.primary ? "bg-brand-50 text-brand-600" : "bg-surface-subtle text-ink")
              }
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={!!action && action !== "menu"} onClose={close} title={action ? TITLES[action] ?? "" : ""}>
        {action === "expense" && <ExpenseForm onDone={close} />}
        {action === "income" && <IncomeForm onDone={close} />}
        {action === "budget" && <BudgetForm onDone={close} />}
        {action === "merchant" && <MerchantForm onDone={close} />}
        {action === "user" && <UserForm onDone={close} />}
      </Sheet>
    </>
  );
}
