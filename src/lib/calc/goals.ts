import type { Cents, SavingsGoal } from "../types";

export interface GoalProgress {
  /** Avancement 0..1 (peut dépasser 1 si l'objectif est atteint/dépassé). */
  pct: number;
  remainingCents: Cents;
  /** Mois restants jusqu'à l'échéance (null si pas d'échéance). */
  monthsLeft: number | null;
  /** Effort mensuel restant pour atteindre l'objectif à temps (null si non calculable). */
  perMonthCents: Cents | null;
  reached: boolean;
}

function monthsUntil(todayIso: string, targetIso: string): number {
  const today = new Date(`${todayIso}T00:00:00`).getTime();
  const target = new Date(`${targetIso}T00:00:00`).getTime();
  if (Number.isNaN(today) || Number.isNaN(target)) return 0;
  if (target <= today) return 0;
  return Math.ceil((target - today) / (30.44 * 86_400_000));
}

export function goalProgress(goal: SavingsGoal, todayIso: string): GoalProgress {
  const pct = goal.targetCents > 0 ? goal.currentCents / goal.targetCents : 0;
  const remainingCents = Math.max(0, goal.targetCents - goal.currentCents);
  const reached = goal.currentCents >= goal.targetCents && goal.targetCents > 0;

  let monthsLeft: number | null = null;
  let perMonthCents: Cents | null = null;
  if (goal.targetDate) {
    monthsLeft = monthsUntil(todayIso, goal.targetDate);
    if (!reached) {
      perMonthCents = monthsLeft > 0 ? Math.ceil(remainingCents / monthsLeft) : remainingCents;
    }
  }

  return { pct, remainingCents, monthsLeft, perMonthCents, reached };
}
