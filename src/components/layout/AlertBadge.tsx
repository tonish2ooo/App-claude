"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { budgetProgressForMonth } from "@/lib/calc/dashboard";

/** Pastille d'alertes budgets près des prénoms : couleur selon l'état, nombre d'alertes. */
export function AlertBadge() {
  const { state, currentMonth } = useAppState();
  const router = useRouter();

  const progress = budgetProgressForMonth(state.budgets, state.expenses, currentMonth);
  const over = progress.filter((p) => p.progress > 1).length;
  const near = progress.filter((p) => p.progress >= 0.8 && p.progress <= 1).length;
  const count = over + near;
  const color = over > 0 ? "#ff3b30" : near > 0 ? "#ff9500" : "#34c759";

  return (
    <button
      type="button"
      onClick={() => router.push("/alerts")}
      aria-label={`${count} alerte${count > 1 ? "s" : ""} de budget`}
      className="flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-xs font-bold text-white transition active:scale-95"
      style={{ background: color }}
    >
      {count}
    </button>
  );
}
