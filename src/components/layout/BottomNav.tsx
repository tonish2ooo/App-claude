"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/primitives";

const TABS = [
  { href: "/", label: "Tableau de bord", icon: "🏠" },
  { href: "/budgets", label: "Budgets", icon: "📊" },
  { href: "/activity", label: "Activité", icon: "📋" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-slate-100 bg-surface/95 backdrop-blur">
      <div className="mx-auto grid max-w-app grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cx(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
                active ? "text-brand-600" : "text-ink-muted",
              )}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
