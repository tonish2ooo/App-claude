"use client";

import type { BudgetSplitRule, UserProfile } from "@/lib/types";
import { Segmented } from "@/components/ui/fields";

/**
 * Éditeur de règle de répartition d'un budget / d'une dépense.
 * - prorata : selon les revenus du mois ;
 * - custom : pourcentages personnalisés, curseur (2 utilisateurs) + champs.
 */
export function SplitEditor({
  rule,
  users,
  onChange,
}: {
  rule: BudgetSplitRule;
  users: UserProfile[];
  onChange: (rule: BudgetSplitRule) => void;
}) {
  const shares = normalizeShares(rule, users);
  const sum = shares.reduce((acc, s) => acc + s.percent, 0);

  function setMode(mode: "prorata" | "custom") {
    if (mode === "prorata") onChange({ mode: "prorata" });
    else onChange({ mode: "custom", shares });
  }

  function setPercent(userId: string, percent: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(percent)));
    let next = shares.map((s) => (s.userId === userId ? { ...s, percent: clamped } : s));
    // Pour 2 utilisateurs : l'autre complète automatiquement à 100.
    if (users.length === 2) {
      const other = users.find((u) => u.id !== userId);
      if (other) {
        next = next.map((s) =>
          s.userId === other.id ? { ...s, percent: 100 - clamped } : s,
        );
      }
    }
    onChange({ mode: "custom", shares: next });
  }

  return (
    <div className="space-y-3">
      <Segmented
        value={rule.mode}
        onChange={(v) => setMode(v as "prorata" | "custom")}
        options={[
          { value: "prorata", label: "Au prorata" },
          { value: "custom", label: "Personnalisé" },
        ]}
      />

      {rule.mode === "prorata" ? (
        <p className="text-xs text-ink-muted">
          Réparti selon les revenus déclarés du mois (salaire + tickets restaurant).
        </p>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const share = shares.find((s) => s.userId === user.id);
            const percent = share?.percent ?? 0;
            return (
              <div key={user.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{user.firstName}</span>
                  <span className="text-ink-soft">{percent} %</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={percent}
                    onChange={(e) => setPercent(user.id, Number(e.target.value))}
                    className="h-2 w-full accent-brand-600"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={percent}
                    onChange={(e) => setPercent(user.id, Number(e.target.value))}
                    className="w-16 rounded-lg border border-surface-muted px-2 py-1 text-right text-sm"
                  />
                </div>
              </div>
            );
          })}
          <p className={"text-xs " + (sum === 100 ? "text-ok" : "text-danger")}>
            {sum === 100 ? "Total : 100 %" : `Total : ${sum} % — la somme doit être égale à 100 %`}
          </p>
        </div>
      )}
    </div>
  );
}

function normalizeShares(rule: BudgetSplitRule, users: UserProfile[]) {
  if (rule.mode === "custom" && rule.shares && rule.shares.length > 0) {
    return users.map((u) => ({
      userId: u.id,
      percent: rule.shares?.find((s) => s.userId === u.id)?.percent ?? 0,
    }));
  }
  // Valeur par défaut équitable.
  const even = users.length > 0 ? Math.floor(100 / users.length) : 0;
  return users.map((u, i) => ({
    userId: u.id,
    percent: i === 0 ? 100 - even * (users.length - 1) : even,
  }));
}
