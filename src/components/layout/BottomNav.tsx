"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/primitives";

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BudgetsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M5 20V10M12 20V4M19 20v-6" strokeLinecap="round" />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M3 12h4l2 6 4-12 2 6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" strokeLinecap="round" />
    </svg>
  );
}

const LEFT = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/budgets", label: "Budgets", icon: BudgetsIcon },
];
const RIGHT = [
  { href: "/activity", label: "Activité", icon: ActivityIcon },
  { href: "/admin", label: "Admin", icon: AdminIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = (tab: { href: string; label: string; icon: () => JSX.Element }) => {
    const active = isActive(tab.href);
    const Icon = tab.icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={cx(
          "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition",
          active ? "text-brand-600" : "text-ink-muted",
        )}
      >
        <Icon />
        {tab.label}
      </Link>
    );
  };

  return (
    <nav className="sticky bottom-0 z-30 mt-auto border-t border-slate-100 bg-surface/95 backdrop-blur">
      <div className="mx-auto grid max-w-app grid-cols-5 items-center">
        {LEFT.map(item)}
        <div aria-hidden />
        {RIGHT.map(item)}
      </div>
    </nav>
  );
}
