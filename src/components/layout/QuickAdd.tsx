"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cx } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { BudgetForm } from "@/components/forms/BudgetForm";
import { MerchantForm } from "@/components/forms/MerchantForm";
import { UserForm } from "@/components/forms/UserForm";
import { BudgetIcon } from "@/components/ui/BudgetIcon";

type Action = "menu" | "expense" | "income" | "budget" | "merchant" | "user" | null;

const QUICK_ITEMS: Array<{ key: Action; label: string; icon: string; primary?: boolean }> = [
  { key: "expense", label: "Ajouter une dépense", icon: "package", primary: true },
  { key: "income", label: "Ajouter un revenu", icon: "wallet" },
  { key: "budget", label: "Ajouter un budget", icon: "bank" },
  { key: "merchant", label: "Ajouter une enseigne", icon: "cart" },
  { key: "user", label: "Ajouter un utilisateur", icon: "star" },
];

const SHEET_TITLES: Partial<Record<string, string>> = {
  expense: "Ajouter une dépense",
  income: "Déclarer un revenu",
  budget: "Nouveau budget",
  merchant: "Nouvelle enseigne",
  user: "Nouvel utilisateur",
};

const QuickAddContext = createContext<{ openMenu: () => void } | null>(null);

/** Ouvre le menu d'ajout rapide partagé (barre mobile et rail Desktop). */
export function useQuickAdd(): { openMenu: () => void } {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd doit être utilisé dans QuickAddProvider");
  return ctx;
}

/** Fournit le menu d'ajout rapide et ses formulaires à toute l'app. */
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<Action>(null);
  const close = () => setAction(null);

  return (
    <QuickAddContext.Provider value={{ openMenu: () => setAction("menu") }}>
      {children}

      {/* Menu rapide */}
      <Sheet open={action === "menu"} onClose={close} title="Que voulez-vous ajouter ?">
        <div className="space-y-2">
          {QUICK_ITEMS.map((item) => (
            <button
              key={item.key as string}
              type="button"
              onClick={() => setAction(item.key)}
              className={cx(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition",
                item.primary ? "bg-brand-50 text-brand-600" : "bg-surface-subtle text-ink",
              )}
            >
              <BudgetIcon name={item.icon} size={20} color={item.primary ? "#13C8A0" : "#3c3c43"} />
              {item.label}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Formulaires */}
      <Sheet open={!!action && action !== "menu"} onClose={close} title={action ? (SHEET_TITLES[action] ?? "") : ""}>
        {action === "expense" && <ExpenseForm onDone={close} />}
        {action === "income" && <IncomeForm onDone={close} />}
        {action === "budget" && <BudgetForm onDone={close} />}
        {action === "merchant" && <MerchantForm onDone={close} />}
        {action === "user" && <UserForm onDone={close} />}
      </Sheet>
    </QuickAddContext.Provider>
  );
}
