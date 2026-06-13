"use client";

import { useAppState } from "@/state/AppStateContext";
import { formatMonthLabel, nextMonth, previousMonth } from "@/lib/date";

export function MonthSwitcher() {
  const { currentMonth, setCurrentMonth } = useAppState();
  return (
    <div className="flex items-center justify-between rounded-2xl bg-surface px-2 py-1.5 shadow-card">
      <button
        type="button"
        onClick={() => setCurrentMonth(previousMonth(currentMonth))}
        className="rounded-full px-3 py-1 text-lg text-ink-soft hover:bg-slate-100"
        aria-label="Mois précédent"
      >
        ‹
      </button>
      <span className="text-sm font-semibold capitalize">{formatMonthLabel(currentMonth)}</span>
      <button
        type="button"
        onClick={() => setCurrentMonth(nextMonth(currentMonth))}
        className="rounded-full px-3 py-1 text-lg text-ink-soft hover:bg-slate-100"
        aria-label="Mois suivant"
      >
        ›
      </button>
    </div>
  );
}
