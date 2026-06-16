"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { key: "expense",  label: "Ajouter une dépense",  icon: "package",  primary: true },
  { key: "income",   label: "Ajouter un revenu",     icon: "wallet"   },
  { key: "budget",   label: "Ajouter un budget",     icon: "bank"     },
  { key: "merchant", label: "Ajouter une enseigne",  icon: "cart"     },
  { key: "user",     label: "Ajouter un utilisateur",icon: "star"     },
];

const SHEET_TITLES: Partial<Record<string, string>> = {
  expense:  "Ajouter une dépense",
  income:   "Déclarer un revenu",
  budget:   "Nouveau budget",
  merchant: "Nouvelle enseigne",
  user:     "Nouvel utilisateur",
};

function HomeIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[25px] w-[25px]">
      <path d="M10.553 2.682a2 2 0 0 1 2.894 0l7 7.318A2 2 0 0 1 21 11.318V20a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-8.682a2 2 0 0 1 .553-1.374l7-7.262z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[25px] w-[25px]">
      <path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BudgetsIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[25px] w-[25px]">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="4" width="4" height="17" rx="1" />
      <rect x="17" y="8" width="4" height="13" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[25px] w-[25px]">
      <path d="M5 20V10M12 20V4M19 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.1 : 1.65} className="h-[25px] w-[25px]">
      <path d="M3 12h4l2 6 4-12 2 6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdminIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[25px] w-[25px]">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 10.5a7.5 7.5 0 0 1-6-3c.03-2 4-3.1 6-3.1s5.97 1.1 6 3.1a7.5 7.5 0 0 1-6 3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[25px] w-[25px]">
      <circle cx="12" cy="8" r="3" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

const LEFT = [
  { href: "/",        label: "Accueil",  Icon: HomeIcon    },
  { href: "/budgets", label: "Budgets",  Icon: BudgetsIcon },
];
const RIGHT = [
  { href: "/activity", label: "Activité", Icon: ActivityIcon },
  { href: "/admin",    label: "Profil",   Icon: AdminIcon    },
];

export function BottomNav() {
  const pathname = usePathname();
  const [action, setAction] = useState<Action>(null);
  const close = () => setAction(null);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = (tab: { href: string; label: string; Icon: (p: { filled: boolean }) => JSX.Element }) => {
    const active = isActive(tab.href);
    const Icon = tab.Icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={cx(
          "flex flex-col items-center gap-0.5 pb-1 pt-2.5 text-[10px] font-medium transition",
          active ? "text-brand-600" : "text-ink-muted",
        )}
      >
        <Icon filled={active} />
        {tab.label}
      </Link>
    );
  };

  return (
    <>
      <nav
        className="sticky bottom-0 z-30 mt-auto bg-surface/90 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto grid max-w-app grid-cols-5 items-center border-t border-surface-muted/60">
          {LEFT.map(item)}

          {/* Centre — bouton + intégré, surélevé pour rester facile à toucher */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              aria-label="Ajouter"
              onClick={() => setAction("menu")}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-fab ring-4 ring-surface transition active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" className="h-7 w-7">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {RIGHT.map(item)}
        </div>
      </nav>

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
              <BudgetIcon
                name={item.icon}
                size={20}
                color={item.primary ? "#007aff" : "#3c3c43"}
              />
              {item.label}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Formulaires */}
      <Sheet open={!!action && action !== "menu"} onClose={close} title={action ? (SHEET_TITLES[action] ?? "") : ""}>
        {action === "expense"  && <ExpenseForm  onDone={close} />}
        {action === "income"   && <IncomeForm   onDone={close} />}
        {action === "budget"   && <BudgetForm   onDone={close} />}
        {action === "merchant" && <MerchantForm onDone={close} />}
        {action === "user"     && <UserForm     onDone={close} />}
      </Sheet>
    </>
  );
}
