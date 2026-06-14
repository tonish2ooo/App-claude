"use client";

import type { ReactNode } from "react";

type IconProps = { size?: number; color?: string; strokeWidth?: number };

function Svg({ size = 24, color = "currentColor", sw = 1.7, children }: {
  size?: number;
  color?: string;
  sw?: number;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, (p: IconProps) => ReactNode> = {
  home: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-5H9v5H4a1 1 0 0 1-1-1z" />
    </Svg>
  ),
  shield: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M12 2 4 6v6c0 4.8 4 8.3 8 10 4-1.7 8-5.2 8-10V6z" />
    </Svg>
  ),
  bank: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M3 21h18M3 11h18M5 11V19M9 11v8M15 11v8M19 11V19M12 3 3 7h18z" />
    </Svg>
  ),
  cart: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M3 6h2l2.5 11a2 2 0 0 0 2 1.5H17a2 2 0 0 0 2-1.5L21 8H7" />
      <circle cx="10" cy="20.5" r="1.2" fill={color} stroke="none" />
      <circle cx="17" cy="20.5" r="1.2" fill={color} stroke="none" />
    </Svg>
  ),
  utensils: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M3 2v7a4 4 0 0 0 4 4v9M7 2v4M5 2v4" />
      <path d="M21 2a6 6 0 0 0-6 6v4h6M15 12v10" />
    </Svg>
  ),
  knife: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M14.5 2.5 19 7l-8.5 8.5-4.5-4.5A3 3 0 0 1 10.5 7z" />
      <path d="M5 17 3 21.5M8.5 13.5l-5 5" />
    </Svg>
  ),
  car: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M5 17H3a2 2 0 0 1-2-2V9l3-5h14l3 5v6a2 2 0 0 1-2 2h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </Svg>
  ),
  zap: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
    </Svg>
  ),
  droplet: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M12 2.5C9.5 6.5 4 13 4 17a8 8 0 0 0 16 0c0-4-5.5-10.5-8-14.5z" />
    </Svg>
  ),
  cup: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M17 8h2a2 2 0 1 1 0 4h-2" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <line x1="6" y1="2" x2="6" y2="5" />
      <line x1="10" y1="2" x2="10" y2="5" />
      <line x1="14" y1="2" x2="14" y2="5" />
    </Svg>
  ),
  backpack: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M4 9a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v11H4z" />
      <path d="M8 5V4a4 4 0 0 1 8 0v1" />
      <path d="M9 14h6M12 11v6" />
    </Svg>
  ),
  dumbbell: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M6.5 6.5 17.5 17.5" />
      <path d="M8 2 4 6M20 16l-4 4M2 8l4-4M16 20l4-4" />
      <rect x="4" y="4" width="4" height="4" rx="1" />
      <rect x="16" y="16" width="4" height="4" rx="1" />
    </Svg>
  ),
  wifi: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M5 12.5A10 10 0 0 1 19 12.5M2 8.5A15 15 0 0 1 22 8.5M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1" fill={color} stroke="none" />
    </Svg>
  ),
  "ev-plug": ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M14 11a4 4 0 0 0-8 0v6h8z" />
      <path d="M6 17v2a2 2 0 0 0 4 0v-2M8 7V2M12 7V2" />
      <path d="M19 6l-2 4h3l-2 4" />
    </Svg>
  ),
  lock: ({ size, color }) => (
    <Svg size={size} color={color}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <circle cx="12" cy="16" r="1.5" fill={color} stroke="none" />
    </Svg>
  ),
  shirt: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M20.4 7.6 16 4a4 4 0 0 1-8 0L3.6 7.6l2.4 3 1-1V21h10V9.6l1 1z" />
    </Svg>
  ),
  package: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12" />
    </Svg>
  ),
  // Extra icons for user-created budgets
  star: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M12 2l3.1 6.3L22 9.3l-5 4.9 1.2 6.8L12 17.8l-6.2 3.2L7 14.2 2 9.3l6.9-1z" />
    </Svg>
  ),
  heart: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
    </Svg>
  ),
  globe: ({ size, color }) => (
    <Svg size={size} color={color}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
    </Svg>
  ),
  coffee: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M17 8h2a2 2 0 1 1 0 4h-2M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <path d="M6 2.5v2M10 2.5v2" />
    </Svg>
  ),
  plane: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </Svg>
  ),
  "piggy-bank": ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M19 6H9a8 8 0 1 0 0 16h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1z" />
      <path d="M19 10h2M9 10a4 4 0 1 0 0 8" />
      <circle cx="11" cy="13" r="1" fill={color} stroke="none" />
    </Svg>
  ),
  wallet: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <circle cx="18" cy="12" r="1.2" fill={color} stroke="none" />
    </Svg>
  ),
  phone: ({ size, color }) => (
    <Svg size={size} color={color}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="18" r="1.2" fill={color} stroke="none" />
    </Svg>
  ),
  medical: ({ size, color }) => (
    <Svg size={size} color={color}>
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M9 11h6M12 8v6" />
    </Svg>
  ),
};

/** Rendu d'une icône budget monochrome (SVG ligne fine). */
export function BudgetIcon({
  name,
  size = 22,
  color = "currentColor",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const render = ICONS[name] ?? ICONS.package!;
  return <>{render({ size, color })}</>;
}

/** Liste de toutes les icônes disponibles (pour le sélecteur). */
export const BUDGET_ICON_NAMES = Object.keys(ICONS);
