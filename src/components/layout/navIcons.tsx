type IconProps = { filled: boolean; className?: string };
const DEFAULT = "h-[25px] w-[25px]";

export function HomeIcon({ filled, className = DEFAULT }: IconProps) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M10.553 2.682a2 2 0 0 1 2.894 0l7 7.318A2 2 0 0 1 21 11.318V20a2 2 0 0 1-2 2h-4a1 1 0 0 1-1-1v-5h-4v5a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-8.682a2 2 0 0 1 .553-1.374l7-7.262z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className={className}>
      <path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BudgetsIcon({ filled, className = DEFAULT }: IconProps) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="4" width="4" height="17" rx="1" />
      <rect x="17" y="8" width="4" height="13" rx="1" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className={className}>
      <path d="M5 20V10M12 20V4M19 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ActivityIcon({ filled, className = DEFAULT }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.1 : 1.65} className={className}>
      <path d="M3 12h4l2 6 4-12 2 6h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminIcon({ filled, className = DEFAULT }: IconProps) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm0 10.5a7.5 7.5 0 0 1-6-3c.03-2 4-3.1 6-3.1s5.97 1.1 6 3.1a7.5 7.5 0 0 1-6 3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" className={className}>
      <circle cx="12" cy="8" r="3" />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

export interface NavTab {
  href: string;
  label: string;
  Icon: (p: IconProps) => JSX.Element;
}

/** Navigation principale, dans l'ordre (utilisée par le rail Desktop). */
export const NAV: NavTab[] = [
  { href: "/", label: "Aperçu", Icon: HomeIcon },
  { href: "/budgets", label: "Budgets", Icon: BudgetsIcon },
  { href: "/activity", label: "Mouvements", Icon: ActivityIcon },
  { href: "/admin", label: "Réglages", Icon: AdminIcon },
];

/** Découpage gauche/droite pour la barre mobile (bouton central « + » au milieu). */
export const NAV_LEFT: NavTab[] = NAV.slice(0, 2);
export const NAV_RIGHT: NavTab[] = NAV.slice(2);
