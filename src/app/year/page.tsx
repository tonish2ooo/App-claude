"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { Amount, BudgetTile, Card, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { computeAnnualOverview } from "@/lib/calc/annual";
import { formatCents } from "@/lib/money";

const MONTH_LETTERS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default function YearPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();
  const [year, setYear] = useState(currentMonth.slice(0, 4));

  const overview = useMemo(
    () =>
      computeAnnualOverview({
        budgets: state.budgets,
        expenses: state.expenses,
        provisions: state.provisions,
        year,
      }),
    [state.budgets, state.expenses, state.provisions, year],
  );

  const budget = (id: string) => state.budgets.find((b) => b.id === id);

  return (
    <div className="space-y-1">
      {/* Sélecteur d'année */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear(String(Number(year) - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-medium text-brand-600 active:bg-surface-muted"
          aria-label="Année précédente"
        >
          ‹
        </button>
        <span className="text-base font-semibold">{year}</span>
        <button
          type="button"
          onClick={() => setYear(String(Number(year) + 1))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-medium text-brand-600 active:bg-surface-muted"
          aria-label="Année suivante"
        >
          ›
        </button>
      </div>

      {/* Synthèse annuelle */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] text-ink-muted">Provisionné</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{formatCents(overview.totalProvisionedCents)}</p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Réel payé</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{formatCents(overview.totalRealCents)}</p>
          <p
            className="text-[11px]"
            style={{ color: overview.totalProvisionedCents - overview.totalRealCents >= 0 ? "#34c759" : "#ff3b30" }}
          >
            écart <Amount cents={overview.totalProvisionedCents - overview.totalRealCents} sign />
          </p>
        </Card>
      </div>

      <SectionTitle>Grosses échéances annuelles</SectionTitle>
      {overview.rows.length === 0 ? (
        <EmptyState icon="📅" title="Aucun budget annuel" hint="Les budgets de type « annuel » apparaissent ici." />
      ) : (
        <div className="space-y-2">
          {overview.rows.map((r) => {
            const b = budget(r.budgetId);
            const color = tileColorFor(r.budgetId);
            const maxMonth = Math.max(...r.monthlyReal, 1);
            return (
              <Card key={r.budgetId}>
                <div className="flex items-center gap-3">
                  <BudgetTile icon={b?.icon ?? "package"} bg={color.bg} color={color.bar} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{b?.name ?? "Budget"}</p>
                    <p className="text-xs text-ink-muted">
                      {formatCents(r.realYtdCents)} payé / {formatCents(r.annualCents)} prévu
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-sm font-semibold"
                    style={{ color: r.gapCents >= 0 ? "#34c759" : "#ff3b30" }}
                  >
                    <Amount cents={r.gapCents} sign />
                  </span>
                </div>

                {/* Calendrier mensuel des dépenses réelles */}
                <div className="mt-3 flex items-end justify-between gap-1">
                  {r.monthlyReal.map((cents, mi) => (
                    <div key={mi} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-10 w-full items-end justify-center">
                        {cents > 0 && (
                          <div
                            className="w-full max-w-[14px] rounded-t"
                            style={{ height: `${Math.max(3, (cents / maxMonth) * 40)}px`, background: color.bar }}
                            title={`${MONTH_LETTERS[mi]} : ${formatCents(cents)}`}
                          />
                        )}
                      </div>
                      <span className="text-[9px] text-ink-muted">{MONTH_LETTERS[mi]}</span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="pt-3">
        <button type="button" className="text-sm font-medium text-brand-600" onClick={() => router.push("/bilan")}>
          Voir le bilan mensuel →
        </button>
      </div>
    </div>
  );
}
