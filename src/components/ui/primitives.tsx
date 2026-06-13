"use client";

import type { ReactNode } from "react";
import { formatCents } from "@/lib/money";

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cx("card card-tap block w-full text-left", className)}>
        {children}
      </button>
    );
  }
  return <div className={cx("card", className)}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-1 mt-6 flex items-center justify-between px-1">
      <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted">{children}</h2>
      {action && <span className="text-sm font-medium text-brand-600">{action}</span>}
    </div>
  );
}

export function Amount({
  cents,
  className,
  sign = false,
}: {
  cents: number;
  className?: string;
  sign?: boolean;
}) {
  const prefix = sign && cents > 0 ? "+" : "";
  return <span className={className}>{prefix}{formatCents(cents)}</span>;
}

/** Circular ring progress — Apple Health style. */
export function RingProgress({
  progress,
  size = 44,
  stroke = 4,
  color = "#007aff",
  bg = "#e5e5ea",
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  bg?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, progress));
  const dash = pct * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)", position: "absolute" }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bg} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 0.4s ease" }}
        />
      </svg>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

/** Legacy horizontal progress bar — kept for simple meters. */
export function ProgressBar({
  progress,
  status,
  color,
}: {
  progress: number;
  status: "normal" | "warning" | "over";
  color?: string;
}) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  const useCustom = color && status !== "over";
  const fallback =
    status === "over" ? "bg-danger" : status === "warning" ? "bg-warn" : "bg-brand-600";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <div
        className={cx("h-full rounded-full transition-all", useCustom ? "" : fallback)}
        style={{ width: `${pct}%`, ...(useCustom ? { backgroundColor: color } : {}) }}
      />
    </div>
  );
}

/** Tuile colorée contenant le pictogramme d'un budget. */
export function BudgetTile({
  icon,
  bg,
  size = 44,
}: {
  icon: string;
  bg: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl shrink-0"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.45 }}
    >
      {icon}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "ok" | "warn" | "danger";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-surface-subtle text-ink-muted",
    brand: "bg-brand-50 text-brand-600",
    ok: "bg-green-50 text-ok",
    warn: "bg-amber-50 text-warn",
    danger: "bg-red-50 text-danger",
  };
  return <span className={cx("pill", tones[tone])}>{children}</span>;
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || "?"}
    </div>
  );
}

/** Mini-courbe décorative et data-driven (SVG, sans dépendance). */
export function Sparkline({
  values,
  className,
  stroke = "rgba(255,255,255,0.95)",
  fill = "rgba(255,255,255,0.18)",
}: {
  values: number[];
  className?: string;
  stroke?: string;
  fill?: string;
}) {
  const w = 120;
  const h = 40;
  const series = values.length >= 2 ? values : [0, 0];
  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const span = max - min || 1;
  const step = w / (series.length - 1);
  const pts = series.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-8 text-center shadow-card">
      <span className="text-3xl">{icon}</span>
      <p className="font-semibold text-ink">{title}</p>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Chevron disclosure icon for list rows. */
export function Chevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-ink-faint">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
