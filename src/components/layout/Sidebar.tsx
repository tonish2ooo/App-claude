"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx, Avatar } from "@/components/ui/primitives";
import { ThemeButton } from "@/components/settings/ThemeButton";
import { AlertBadge } from "@/components/layout/AlertBadge";
import { useQuickAdd } from "@/components/layout/QuickAdd";
import { NAV } from "@/components/layout/navIcons";
import type { UserProfile } from "@/lib/types";

/** Rail de navigation latéral pour la mise en page Desktop. */
export function Sidebar({ names, currentUser }: { names: string; currentUser: UserProfile }) {
  const pathname = usePathname();
  const { openMenu } = useQuickAdd();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="sticky top-0 flex h-dvh w-64 shrink-0 flex-col border-r border-surface-muted/60 bg-surface px-4 py-6">
      <div className="px-2">
        <p className="text-[13px] text-ink-muted">Bonjour</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold tracking-tight">{names}</p>
          <AlertBadge />
        </div>
      </div>

      <button type="button" onClick={openMenu} className="btn-primary mt-6 w-full">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-5 w-5">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
        Ajouter
      </button>

      <nav className="mt-6 flex flex-col gap-1">
        {NAV.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.Icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-brand-50 text-brand-600" : "text-ink-muted hover:bg-surface-subtle",
              )}
            >
              <Icon filled={active} className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center justify-between px-2 pt-6">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={`${currentUser.firstName} ${currentUser.lastName}`} src={currentUser.photoUrl} size={36} />
          <span className="truncate text-sm font-medium">{currentUser.firstName}</span>
        </div>
        <ThemeButton />
      </div>
    </aside>
  );
}
