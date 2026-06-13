"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/primitives";

function HomeIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[26px] w-[26px]">
      <path d="M10.553 2.682a2 2 0 0 1 2.894 0l7 7.318A2 2 0 0 1 21 11.318V20a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-8.682a2 2 0 0 1 .553-1.374l7-7.262z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[26px] w-[26px]">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BudgetsIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[26px] w-[26px]">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="4" width="4" height="17" rx="1" />
      <rect x="17" y="8" width="4" height="13" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[26px] w-[26px]">
      <path d="M5 20V10M12 20V4M19 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-[26px] w-[26px]">
      <path d="M3 12h4l2 6 4-12 2 6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[26px] w-[26px]">
      <path d="M3 12h4l2 6 4-12 2 6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AdminIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[26px] w-[26px]">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 10.5a7.5 7.5 0 0 1-6-3c.03-2 4-3.1 6-3.1s5.97 1.1 6 3.1a7.5 7.5 0 0 1-6 3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[26px] w-[26px]">
      <circle cx="12" cy="8" r="3" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

const LEFT = [
  { href: "/", label: "Accueil", Icon: HomeIcon },
  { href: "/budgets", label: "Budgets", Icon: BudgetsIcon },
];
const RIGHT = [
  { href: "/activity", label: "Activité", Icon: ActivityIcon },
  { href: "/admin", label: "Profil", Icon: AdminIcon },
];

export function BottomNav() {
  const pathname = usePathname();
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
    <nav className="sticky bottom-0 z-30 mt-auto bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto grid max-w-app grid-cols-5 items-center border-t border-surface-muted/60">
        {LEFT.map(item)}
        <div aria-hidden />
        {RIGHT.map(item)}
      </div>
    </nav>
  );
}
