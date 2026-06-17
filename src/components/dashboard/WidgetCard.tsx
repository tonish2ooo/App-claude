"use client";

import type { ReactNode } from "react";
import { Amount, ProgressBar, RingProgress } from "@/components/ui/primitives";
import { goalProgress } from "@/lib/calc/goals";
import { formatCents } from "@/lib/money";
import type { Budget, Expense, MonthlyDashboardSummary, SavingsGoal } from "@/lib/types";
import type { WidgetSize, WidgetType } from "@/lib/dashboard/layout";

export interface WidgetCtx {
  summary: MonthlyDashboardSummary;
  watchedBudgets: Budget[];
  toClassify: Expense[];
  goals: SavingsGoal[];
  userName: (id: string) => string;
  budgetName: (id?: string) => string;
  merchantName: (id?: string) => string;
  perDayCents: number;
  onTrack: boolean;
  globalProgress: number;
  lastDayLabel: string;
  today: string;
  mealRemaining: number;
  mealGranted: number;
  mealRatio: number;
  mealColor: string;
  commonRatio: number;
  commonColor: string;
  navigate: (href: string) => void;
}

const GREEN = "#13C8A0";

function Head({ children }: { children: ReactNode }) {
  return <p className="text-[12px] font-medium text-ink-muted">{children}</p>;
}

/** Contenu d'un widget selon son type et sa taille. */
export function WidgetCard({ type, size, ctx }: { type: WidgetType; size: WidgetSize; ctx: WidgetCtx }) {
  const { summary } = ctx;

  switch (type) {
    case "remaining": {
      const big = size === "large" ? "text-[34px]" : size === "medium" ? "text-3xl" : "text-2xl";
      return (
        <div className="flex h-full flex-col">
          <Head>Disponible jusqu'au {ctx.lastDayLabel}</Head>
          <div className="mt-1 flex flex-1 items-center gap-3">
            {size === "large" && (
              <RingProgress progress={ctx.globalProgress} size={68} stroke={7} color={ctx.onTrack ? GREEN : "#FF9F0A"}>
                <span className="text-[11px] font-bold text-ink-muted">{Math.round(ctx.globalProgress * 100)}%</span>
              </RingProgress>
            )}
            <div className="min-w-0">
              <p className={`font-extrabold leading-none tracking-tight ${big}`} style={{ color: summary.remainingBudgetCents >= 0 ? GREEN : "#FF453A" }}>
                <Amount cents={summary.remainingBudgetCents} />
              </p>
              <p className="mt-1 text-[11px] text-ink-muted">{formatCents(ctx.perDayCents)} / jour possible</p>
            </div>
          </div>
          {size !== "small" && (
            <p className="mt-1 text-[12px] font-medium" style={{ color: ctx.onTrack ? GREEN : "#FF9F0A" }}>
              {Math.round(ctx.globalProgress * 100)} % utilisé · {ctx.onTrack ? "dans le rythme" : "au-dessus du rythme"}
            </p>
          )}
        </div>
      );
    }

    case "monthSpend":
      return (
        <div className="flex h-full flex-col">
          <Head>Dépensé ce mois</Head>
          <p className="mt-1 text-2xl font-bold tracking-tight">{formatCents(summary.spentTotalCents)}</p>
          <p className="text-[11px] text-ink-muted">sur {formatCents(summary.budgetTotalCents)}</p>
          <div className="mt-auto pt-2">
            <ProgressBar progress={ctx.globalProgress} status={ctx.globalProgress > 1 ? "over" : "normal"} color={GREEN} />
          </div>
        </div>
      );

    case "common":
      return (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-2">
            <Head>Compte commun</Head>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(255,255,255,0.10)", color: "rgb(var(--ink-muted))" }}>
              {summary.commonBalanceStatus === "synced" ? "Synchro" : "Estimé"}
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: summary.commonBalanceCents < 0 ? "#FF453A" : "rgb(var(--ink))" }}>
            <Amount cents={summary.commonBalanceCents} />
          </p>
          <p className="text-[11px] text-ink-muted">sur {formatCents(summary.commonAccountTotalCents)}</p>
          <div className="mt-auto pt-2">
            <ProgressBar progress={ctx.commonRatio} status="normal" color={ctx.commonColor} />
          </div>
        </div>
      );

    case "meal":
      return (
        <div className="flex h-full flex-col">
          <Head>Tickets restaurant</Head>
          <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: ctx.mealColor }}>
            <Amount cents={ctx.mealRemaining} />
          </p>
          <p className="text-[11px] text-ink-muted">sur {formatCents(ctx.mealGranted)}</p>
          <div className="mt-auto pt-2">
            <ProgressBar progress={ctx.mealRatio} status="normal" color={ctx.mealColor} />
          </div>
        </div>
      );

    case "watch": {
      const list = ctx.watchedBudgets;
      return (
        <div className="flex h-full flex-col">
          <Head>Budgets à surveiller</Head>
          {list.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Tout est dans le rythme ✅</p>
          ) : (
            <div className="mt-2 space-y-2">
              {list.map((b) => {
                const p = summary.budgetProgress.find((x) => x.budgetId === b.id);
                const pct = p?.progress ?? 0;
                const over = pct > 1;
                return (
                  <div key={b.id}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="min-w-0 flex-1 truncate">{b.name}</span>
                      <span className="font-semibold" style={{ color: over ? "#FF453A" : "#FF9F0A" }}>
                        {Math.round(pct * 100)} %
                      </span>
                    </div>
                    <div className="mt-1">
                      <ProgressBar progress={pct} status={over ? "over" : "warning"} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    case "todo": {
      const list = ctx.toClassify;
      return (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <Head>À traiter</Head>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-warn">{ctx.toClassify.length}</span>
          </div>
          {list.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Rien à traiter 🎉</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              {list.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2 text-[13px]">
                  <span className="min-w-0 flex-1 truncate">{ctx.merchantName(e.merchantId)}</span>
                  <span className="shrink-0 font-semibold">{formatCents(e.amountCents)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    case "people": {
      const list = summary.contributions;
      return (
        <div className="flex h-full flex-col">
          <Head>Répartition du foyer</Head>
          <div className="mt-2 space-y-2">
            {list.map((c) => (
              <div key={c.userId} className="rounded-xl bg-surface-subtle p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{ctx.userName(c.userId)}</span>
                  <span className="text-[11px] text-ink-muted">{Math.round(c.incomeSharePct * 100)} %</span>
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
                  <span>Argent de poche</span>
                  <span className="font-semibold" style={{ color: c.remainingTotalCents < 0 ? "#FF453A" : GREEN }}>
                    {formatCents(c.remainingTotalCents)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "goals": {
      const list = ctx.goals;
      return (
        <div className="flex h-full flex-col">
          <Head>Objectifs d'épargne</Head>
          {list.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Aucun objectif</p>
          ) : (
            <div className="mt-2 space-y-2">
              {list.map((g) => {
                const p = goalProgress(g, ctx.today);
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="min-w-0 flex-1 truncate">{g.name}</span>
                      <span className="text-ink-muted">{Math.round(p.pct * 100)} %</span>
                    </div>
                    <div className="mt-1">
                      <ProgressBar progress={Math.min(1, p.pct)} status="normal" color={GREEN} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    case "links":
      return (
        <div className="flex h-full flex-col">
          <Head>Raccourcis</Head>
          <div className="mt-2 grid flex-1 grid-cols-2 gap-2">
            {[
              { icon: "📈", label: "Stats", href: "/stats" },
              { icon: "🧾", label: "Bilan", href: "/bilan" },
              { icon: "📅", label: "Année", href: "/year" },
              { icon: "🚦", label: "Alertes", href: "/alerts" },
            ]
              .slice(0, size === "small" ? 2 : 4)
              .map((l) => (
                <div key={l.href} className="flex items-center gap-1.5 rounded-xl bg-surface-subtle px-2 py-2 text-xs font-medium">
                  <span>{l.icon}</span>
                  {l.label}
                </div>
              ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

/** Cible de navigation au tap d'un widget (hors mode édition). */
export function widgetHref(type: WidgetType): string | null {
  switch (type) {
    case "remaining":
    case "monthSpend":
    case "goals":
      return "/budgets";
    case "watch":
      return "/alerts";
    case "todo":
      return "/activity";
    case "people":
      return "/admin/users";
    case "links":
      return "/stats";
    default:
      return null;
  }
}
