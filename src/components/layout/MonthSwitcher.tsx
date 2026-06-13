"use client";

import { useAppState } from "@/state/AppStateContext";
import { formatMonthLabel, nextMonth, previousMonth } from "@/lib/date";

export function MonthSwitcher() {
  const { currentMonth, setCurrentMonth } = useAppState();
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => setCurrentMonth(previousMonth(currentMonth))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-medium text-brand-600 transition active:bg-surface-muted"
        aria-label="Mois précédent"
      >
        ‹
      </button>
      <span className="text-base font-semibold capitalize">{formatMonthLabel(currentMonth)}</span>
      <button
        type="button"
        onClick={() => setCurrentMonth(nextMonth(currentMonth))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-medium text-brand-600 transition active:bg-surface-muted"
        aria-label="Mois suivant"
      >
        ›
      </button>
    </div>
  );
}
