"use client";

import { BudgetTile, ProgressBar } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { formatCents } from "@/lib/money";
import type { Budget } from "@/lib/types";

interface Progress {
  spentCents: number;
  plannedMonthlyCents: number;
  progress: number;
}

function budgetStatus(spent: number, planned: number, active: boolean) {
  if (!active) return { text: "Inactif", tone: "muted" as const, pct: 0 };
  const pct = planned > 0 ? spent / planned : 0;
  if (pct > 1) {
    return { text: `${formatCents(spent - planned)} dépassés`, tone: "over" as const, pct };
  }
  if (planned > 0 && spent >= planned) {
    return { text: "Budget atteint", tone: "warning" as const, pct: 1 };
  }
  return {
    text: `${formatCents(planned - spent)} restants`,
    tone: pct >= 0.8 ? ("warning" as const) : ("normal" as const),
    pct,
  };
}

const TONE_COLOR: Record<string, string> = {
  over: "#FF453A",
  warning: "#FF9F0A",
  normal: "#FFFFFF",
  muted: "#8e8e93",
};

/** Ligne de budget compacte : icône, montants, statut explicite et barre horizontale. */
export function BudgetRow({
  budget,
  progress,
  onClick,
}: {
  budget: Budget;
  progress?: Progress;
  onClick?: () => void;
}) {
  const color = tileColorFor(budget.id);
  const spent = progress?.spentCents ?? 0;
  const planned = progress?.plannedMonthlyCents ?? budget.amountCents;
  const s = budgetStatus(spent, planned, budget.active);
  const barStatus = s.tone === "over" ? "over" : s.tone === "warning" ? "warning" : "normal";

  return (
    <button type="button" onClick={onClick} className="block w-full py-3 text-left">
      <div className="flex items-center gap-3">
        <BudgetTile icon={budget.icon} bg={color.bg} color={color.bar} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-semibold">{budget.name}</p>
            <p className="shrink-0 text-sm font-semibold">
              {formatCents(spent)} <span className="font-normal text-ink-muted">/ {formatCents(planned)}</span>
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar
              progress={s.pct}
              status={barStatus}
              color={s.tone === "normal" ? color.bar : undefined}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span style={{ color: TONE_COLOR[s.tone] }} className={s.tone === "normal" ? "text-ink-soft" : ""}>
              {s.text}
            </span>
            <span className="text-ink-muted">{Math.round(s.pct * 100)} %</span>
          </div>
        </div>
      </div>
    </button>
  );
}
