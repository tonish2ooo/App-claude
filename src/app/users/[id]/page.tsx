"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { Avatar, Card, EmptyState, Pill, RingProgress, SectionTitle } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { UserForm } from "@/components/forms/UserForm";
import { computeUserInsights } from "@/lib/calc/users";
import { formatCents } from "@/lib/money";

const ROLE_LABEL: Record<string, string> = { owner: "Propriétaire", admin: "Admin", member: "Membre" };

function shortMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(new Date(y, m - 1, 1))
    .replace(".", "");
}

export default function UserDetailPage() {
  const app = useAppState();
  const { state, currentMonth } = app;
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [editing, setEditing] = useState(false);

  const user = state.users.find((u) => u.id === id);

  const insights = useMemo(
    () =>
      computeUserInsights({
        userId: id,
        users: state.users,
        budgets: state.budgets,
        incomes: state.incomes,
        expenses: state.expenses,
        month: currentMonth,
      }),
    [id, state.users, state.budgets, state.incomes, state.expenses, currentMonth],
  );

  if (!user) {
    return (
      <div className="space-y-3">
        <EmptyState icon="🔍" title="Utilisateur introuvable" />
        <button type="button" className="btn-ghost w-full" onClick={() => router.push("/admin/users")}>
          Retour aux utilisateurs
        </button>
      </div>
    );
  }

  const recentIncome = insights.monthlyIncome.slice(-6);
  const maxIncome = Math.max(...recentIncome.map((d) => d.totalCents), 1);

  return (
    <div className="space-y-1">
      <button type="button" className="mt-2 text-sm font-medium text-brand-600" onClick={() => router.back()}>
        ‹ Retour
      </button>

      {/* En-tête */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={`${user.firstName} ${user.lastName}`} src={user.photoUrl} size={52} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold">
                {user.firstName} {user.lastName}
              </h1>
              <div className="mt-0.5 flex items-center gap-2">
                <Pill tone="brand">{ROLE_LABEL[user.role]}</Pill>
                {!user.active && <Pill tone="neutral">Inactif</Pill>}
              </div>
              {user.email && <p className="mt-1 truncate text-xs text-ink-muted">{user.email}</p>}
            </div>
          </div>
        </Card>
      </div>

      {/* Revenu du mois + part du foyer */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center gap-4">
            <RingProgress progress={insights.incomeSharePct} size={64} stroke={6} color="#13C8A0">
              <span className="text-[11px] font-bold" style={{ color: "#13C8A0" }}>
                {Math.round(insights.incomeSharePct * 100)}%
              </span>
            </RingProgress>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ink-muted">Revenu du mois</p>
              <p className="mt-0.5 text-[26px] font-bold leading-none tracking-tight">
                {formatCents(insights.incomeTotalCents)}
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                {Math.round(insights.incomeSharePct * 100)} % du foyer · salaire {formatCents(insights.salaryCents)} + TR{" "}
                {formatCents(insights.mealVouchersCents)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Indicateurs */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] text-ink-muted">Contribution du mois</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{formatCents(insights.contributionCents)}</p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Argent de poche</p>
          <p
            className="mt-1 text-xl font-bold tracking-tight"
            style={{ color: insights.pocketMoneyCents < 0 ? "#ff3b30" : "#34c759" }}
          >
            {formatCents(insights.pocketMoneyCents)}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Taux d'effort</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{Math.round(insights.effortRate * 100)} %</p>
          <p className="text-[11px] text-ink-muted">de son revenu</p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Revenu moyen</p>
          <p className="mt-1 text-xl font-bold tracking-tight">
            {insights.avgIncomeCents !== null ? formatCents(insights.avgIncomeCents) : "—"}
          </p>
          <p className="text-[11px] text-ink-muted">{insights.monthsDeclared} mois déclarés</p>
        </Card>
      </div>

      {/* Tickets restaurant */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-ink-muted">Tickets restaurant</p>
            <p className="font-semibold" style={{ color: insights.mealRemainingCents < 0 ? "#ff3b30" : "#32ade6" }}>
              {formatCents(insights.mealRemainingCents)}
              <span className="font-normal text-ink-muted"> / {formatCents(insights.mealGrantedCents)}</span>
            </p>
          </div>
          {insights.mealGrantedCents > 0 && (
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                style={{
                  width: `${Math.max(0, Math.min(1, insights.mealRemainingCents / insights.mealGrantedCents)) * 100}%`,
                  background: "#32ade6",
                  height: "100%",
                }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Évolution du revenu */}
      {insights.monthlyIncome.length > 0 && (
        <div className="mt-2">
          <Card>
            <p className="text-[13px] text-ink-muted">Évolution du revenu</p>
            <div className="mt-3 flex h-24 items-end justify-between gap-2">
              {recentIncome.map((dpt) => (
                <div key={dpt.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-end justify-center" style={{ height: 72 }}>
                    <div
                      className="w-full max-w-[26px] rounded-t-md bg-brand-600"
                      style={{ height: `${Math.max(4, (dpt.totalCents / maxIncome) * 72)}px` }}
                      title={formatCents(dpt.totalCents)}
                    />
                  </div>
                  <span className="text-[10px] capitalize text-ink-muted">{shortMonthLabel(dpt.month)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Dépenses enregistrées */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-ink-muted">Dépenses enregistrées</p>
            <p className="font-semibold">
              {insights.expensesLoggedCount}
              <span className="font-normal text-ink-muted"> · {formatCents(insights.expensesLoggedTotalCents)}</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 pb-4">
        <button type="button" className="btn-ghost flex-1" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button
          type="button"
          className="btn-ghost flex-1"
          onClick={() => app.updateUser(user.id, { active: !user.active })}
        >
          {user.active ? "Désactiver" : "Activer"}
        </button>
        <button
          type="button"
          className="btn-danger flex-1"
          onClick={() => {
            if (typeof window !== "undefined" && !window.confirm("Supprimer cet utilisateur ?")) return;
            app.removeUser(user.id);
            router.push("/admin/users");
          }}
        >
          Supprimer
        </button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Modifier l'utilisateur">
        <UserForm user={user} onDone={() => setEditing(false)} />
      </Sheet>
    </div>
  );
}
