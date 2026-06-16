import type { Month } from "./types";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(month: string): month is Month {
  return MONTH_RE.test(month);
}

/** Mois courant au format "YYYY-MM" à partir d'une date (par défaut maintenant). */
export function currentMonth(date: Date = new Date()): Month {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Date du jour au format "YYYY-MM-DD". */
export function todayIso(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Index de mois (0..11) à partir d'un "YYYY-MM". */
export function monthIndex(month: Month): number {
  const part = month.split("-")[1];
  const n = part ? Number(part) : 1;
  return Math.min(11, Math.max(0, n - 1));
}

/** Mois précédent au format "YYYY-MM". */
export function previousMonth(month: Month): Month {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (m <= 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Mois suivant au format "YYYY-MM". */
export function nextMonth(month: Month): Month {
  const [yStr, mStr] = month.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (m >= 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Libellé lisible du mois (ex : "juin 2026"). */
export function formatMonthLabel(month: Month): string {
  if (!isValidMonth(month)) return month;
  const [y, m] = month.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, 1);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Libellé lisible d'une date "YYYY-MM-DD" (ex : "12 juin 2026"). */
export function formatDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Liste de n mois consécutifs se terminant par `endMonth` (ordre croissant). */
export function lastNMonths(endMonth: Month, n: number): Month[] {
  const out: Month[] = [];
  let m = endMonth;
  for (let i = 0; i < n; i += 1) {
    out.unshift(m);
    m = previousMonth(m);
  }
  return out;
}

/** Mois de l'année de `endMonth`, de janvier jusqu'à `endMonth` inclus. */
export function monthsOfYearUpTo(endMonth: Month): Month[] {
  const year = endMonth.slice(0, 4);
  const end = Number(endMonth.slice(5, 7)) || 1;
  const out: Month[] = [];
  for (let m = 1; m <= end; m += 1) out.push(`${year}-${String(m).padStart(2, "0")}`);
  return out;
}

/** Compare deux mois : <0 si a avant b, 0 si égaux, >0 si a après b. */
export function compareMonths(a: Month, b: Month): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
