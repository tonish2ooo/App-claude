"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/primitives";
import { useQuickAdd } from "@/components/layout/QuickAdd";
import { NAV_LEFT, NAV_RIGHT, type NavTab } from "@/components/layout/navIcons";

export function BottomNav() {
  const pathname = usePathname();
  const { openMenu } = useQuickAdd();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const item = (tab: NavTab) => {
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
    <nav
      className="sticky bottom-0 z-30 mt-auto bg-surface/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-app grid-cols-5 items-center border-t border-surface-muted/60">
        {NAV_LEFT.map(item)}

        {/* Centre — bouton + intégré, surélevé pour rester facile à toucher */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            aria-label="Ajouter"
            onClick={openMenu}
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-fab ring-4 ring-surface transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" className="h-7 w-7">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {NAV_RIGHT.map(item)}
      </div>
    </nav>
  );
}
