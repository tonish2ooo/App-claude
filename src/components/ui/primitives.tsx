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
    <div className="mb-2 mt-5 flex items-center justify-between px-1">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{children}</h2>
      {action}
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

export function ProgressBar({
  progress,
  status,
}: {
  progress: number;
  status: "normal" | "warning" | "over";
}) {
  const pct = Math.min(100, Math.max(0, progress * 100));
  const color =
    status === "over" ? "bg-danger" : status === "warning" ? "bg-warn" : "bg-brand-600";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
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
    neutral: "bg-slate-100 text-ink-soft",
    brand: "bg-brand-50 text-brand-700",
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
      className="flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || "?"}
    </div>
  );
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-surface p-8 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="font-medium text-ink">{title}</p>
      {hint && <p className="text-sm text-ink-muted">{hint}</p>}
    </div>
  );
}
