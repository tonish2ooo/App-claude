"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui/primitives";

function ListIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.2 : 1.65} className="h-[25px] w-[25px]">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProductsIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[25px] w-[25px]">
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L21 8H7" />
      <circle cx="10" cy="20" r="1.6" />
      <circle cx="17" cy="20" r="1.6" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[25px] w-[25px]">
      <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h7.7a2 2 0 0 0 2-1.6L21 8H7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="20" r="1.2" />
      <circle cx="17" cy="20" r="1.2" />
    </svg>
  );
}

function TeamIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-[25px] w-[25px]">
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M2 19c0-3.4 3.1-5 7-5s7 1.6 7 5zM16 14c3 .2 6 1.6 6 5h-5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className="h-[25px] w-[25px]">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 19c0-3.2 2.9-4.6 6.5-4.6s6.5 1.4 6.5 4.6M16 14.5c2.7.2 5.5 1.4 5.5 4.5h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TABS = [
  { href: "/", label: "Liste", Icon: ListIcon },
  { href: "/produits", label: "Produits", Icon: ProductsIcon },
  { href: "/equipe", label: "Équipe", Icon: TeamIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav
      className="sticky bottom-0 z-30 mt-auto bg-surface/90 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-app grid-cols-3 items-center border-t border-surface-muted/60">
        {TABS.map((tab) => {
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
        })}
      </div>
    </nav>
  );
}
