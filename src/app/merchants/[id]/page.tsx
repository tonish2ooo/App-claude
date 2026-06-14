"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { Avatar, BudgetTile, Card, Chevron, EmptyState, Pill, SectionTitle } from "@/components/ui/primitives";
import { tileColorFor } from "@/components/ui/budgetColor";
import { Sheet } from "@/components/ui/Sheet";
import { MerchantForm } from "@/components/forms/MerchantForm";
import { ExpenseSheet } from "@/components/expenses/ExpenseSheet";
import { computeMerchantInsights } from "@/lib/calc/merchants";
import { geocodeAddress } from "@/lib/geo";
import { formatCents } from "@/lib/money";
import { formatDateLabel } from "@/lib/date";

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function shortMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Intl.DateTimeFormat("fr-FR", { month: "short" })
    .format(new Date(y, m - 1, 1))
    .replace(".", "");
}

const CATEGORY_LABEL: Record<string, string> = {
  alimentation: "Alimentation",
  restaurant: "Restaurant",
  transport: "Transport",
  logement: "Logement",
  loisirs: "Loisirs",
  sante: "Santé",
  assurance: "Assurance",
  abonnement: "Abonnement",
  shopping: "Shopping",
  autre: "Autre",
};

export default function MerchantDetailPage() {
  const app = useAppState();
  const { state } = app;
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [editing, setEditing] = useState(false);
  const [openExpenseId, setOpenExpenseId] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const merchant = state.merchants.find((m) => m.id === id);

  const { insights, history } = useMemo(() => {
    const linked = state.expenses
      .filter((e) => e.merchantId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
    return { insights: computeMerchantInsights(id, state.expenses), history: linked };
  }, [state.expenses, id]);

  if (!merchant) {
    return (
      <div className="space-y-3">
        <EmptyState icon="🔍" title="Enseigne introuvable" />
        <button type="button" className="btn-ghost w-full" onClick={() => router.push("/admin/merchants")}>
          Retour aux enseignes
        </button>
      </div>
    );
  }

  const budgetName = (bid?: string) => state.budgets.find((b) => b.id === bid)?.name ?? "Sans budget";
  const hasGeo = merchant.latitude !== undefined && merchant.longitude !== undefined;
  const lat = merchant.latitude ?? 0;
  const lng = merchant.longitude ?? 0;
  const d = 0.004;
  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  const mapsQuery = hasGeo ? `${lat},${lng}` : encodeURIComponent(merchant.address ?? "");
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const topBudget = insights.topBudgetId
    ? state.budgets.find((b) => b.id === insights.topBudgetId)
    : undefined;
  const freqLabel =
    insights.avgDaysBetween === null
      ? "—"
      : insights.avgDaysBetween < 1
      ? "Quotidien"
      : `~${Math.round(insights.avgDaysBetween)} j`;
  const paymentTotal = insights.commonAccountCents + insights.mealVoucherCents;
  const commonPct = paymentTotal > 0 ? insights.commonAccountCents / paymentTotal : 1;
  const recentMonthly = insights.monthly.slice(-6);
  const maxMonthly = Math.max(...recentMonthly.map((d) => d.amountCents), 1);

  async function locateAddress() {
    if (!merchant?.address) return;
    setGeocoding(true);
    setGeoError(false);
    const point = await geocodeAddress(merchant.address);
    setGeocoding(false);
    if (point) {
      app.updateMerchant(merchant.id, { latitude: point.latitude, longitude: point.longitude });
    } else {
      setGeoError(true);
    }
  }

  return (
    <div className="space-y-1">
      <button type="button" className="mt-2 text-sm font-medium text-brand-600" onClick={() => router.back()}>
        ‹ Retour
      </button>

      {/* En-tête */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center gap-3">
            <Avatar name={merchant.name} src={merchant.logoUrl ?? merchant.photoUrl} size={52} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold">{merchant.name}</h1>
              <Pill tone="neutral">{CATEGORY_LABEL[merchant.category] ?? merchant.category}</Pill>
            </div>
          </div>
          {(merchant.address || merchant.phone) && (
            <div className="mt-3 space-y-1 text-sm">
              {merchant.address && <p className="text-ink-soft">{merchant.address}</p>}
              {merchant.phone && (
                <a href={`tel:${merchant.phone}`} className="font-medium text-brand-600">
                  {merchant.phone}
                </a>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Localisation */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold">Localisation</p>
            {(hasGeo || merchant.address) && (
              <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-600">
                Voir sur la carte
              </a>
            )}
          </div>
          {hasGeo ? (
            <>
              <div className="mt-2 overflow-hidden rounded-2xl border border-surface-muted">
                <iframe
                  title={`Carte ${merchant.name}`}
                  src={osmEmbed}
                  className="h-44 w-full"
                  loading="lazy"
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </>
          ) : merchant.address ? (
            <div className="mt-2">
              <p className="text-sm text-ink-muted">Position pas encore calculée pour cette adresse.</p>
              <button
                type="button"
                className="btn-primary mt-2 w-full"
                onClick={locateAddress}
                disabled={geocoding}
              >
                {geocoding ? "Recherche…" : "🗺️ Localiser cette adresse"}
              </button>
              {geoError && (
                <p className="mt-1 text-xs text-danger">
                  Adresse introuvable. Précisez-la (numéro, ville) dans « Modifier ».
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-muted">
              Aucune adresse ni position. Ouvrez « Modifier » pour renseigner l'adresse, puis
              « Localiser l'adresse » (ou « Ma position » sur place).
            </p>
          )}
        </Card>
      </div>

      {/* Statistiques — tableau de bord */}
      <SectionTitle>Statistiques</SectionTitle>

      {/* Total + budget principal */}
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] text-ink-muted">Total dépensé ici</p>
            <p className="mt-0.5 text-[28px] font-bold leading-none tracking-tight">
              {formatCents(insights.totalAmountCents)}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {insights.expenseCount} visite{insights.expenseCount > 1 ? "s" : ""}
              {insights.perMonthCents !== null && ` · ${formatCents(insights.perMonthCents)}/mois`}
            </p>
          </div>
          {topBudget && (
            <BudgetTile
              icon={topBudget.icon}
              bg={tileColorFor(topBudget.id).bg}
              color={tileColorFor(topBudget.id).bar}
              size={48}
            />
          )}
        </div>
      </Card>

      {/* Tuiles d'indicateurs */}
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] text-ink-muted">Dépense moyenne</p>
          <p className="mt-1 text-xl font-bold tracking-tight">
            {insights.averageAmountCents !== null ? formatCents(insights.averageAmountCents) : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Fréquence de visite</p>
          <p className="mt-1 text-xl font-bold tracking-tight">{freqLabel}</p>
          <p className="text-[11px] text-ink-muted">{insights.avgDaysBetween !== null ? "entre 2 visites" : ""}</p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Plus grosse</p>
          <p className="mt-1 text-xl font-bold tracking-tight">
            {insights.maxAmountCents !== null ? formatCents(insights.maxAmountCents) : "—"}
          </p>
        </Card>
        <Card>
          <p className="text-[11px] text-ink-muted">Plus petite</p>
          <p className="mt-1 text-xl font-bold tracking-tight">
            {insights.minAmountCents !== null ? formatCents(insights.minAmountCents) : "—"}
          </p>
        </Card>
      </div>

      {/* Budget principal */}
      <div className="mt-2">
        <Card>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-ink-muted">Budget principal</p>
            {topBudget ? (
              <span className="inline-flex items-center gap-2 font-semibold">
                <BudgetTile
                  icon={topBudget.icon}
                  bg={tileColorFor(topBudget.id).bg}
                  color={tileColorFor(topBudget.id).bar}
                  size={24}
                />
                {topBudget.name}
              </span>
            ) : (
              <span className="text-ink-muted">—</span>
            )}
          </div>
        </Card>
      </div>

      {/* Répartition du paiement */}
      {insights.totalAmountCents > 0 && (
        <div className="mt-2">
          <Card>
            <p className="text-[13px] text-ink-muted">Répartition du paiement</p>
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <div style={{ width: `${commonPct * 100}%`, background: "#007aff" }} />
              <div style={{ width: `${(1 - commonPct) * 100}%`, background: "#32ade6" }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span style={{ color: "#007aff" }}>Compte commun {formatCents(insights.commonAccountCents)}</span>
              <span style={{ color: "#32ade6" }}>Tickets resto {formatCents(insights.mealVoucherCents)}</span>
            </div>
          </Card>
        </div>
      )}

      {/* Évolution mensuelle */}
      {insights.monthly.length > 0 && (
        <div className="mt-2">
          <Card>
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-ink-muted">Évolution mensuelle</p>
              {insights.topWeekday !== null && (
                <span className="text-xs text-ink-muted">Surtout le {WEEKDAYS[insights.topWeekday]}</span>
              )}
            </div>
            <div className="mt-3 flex h-24 items-end justify-between gap-2">
              {recentMonthly.map((dpt) => (
                <div key={dpt.month} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex w-full items-end justify-center" style={{ height: 72 }}>
                    <div
                      className="w-full max-w-[26px] rounded-t-md bg-brand-600"
                      style={{ height: `${Math.max(4, (dpt.amountCents / maxMonthly) * 72)}px` }}
                      title={formatCents(dpt.amountCents)}
                    />
                  </div>
                  <span className="text-[10px] capitalize text-ink-muted">{shortMonthLabel(dpt.month)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Première / dernière visite */}
      {insights.firstDate && insights.lastDate && (
        <p className="px-1 pt-2 text-xs text-ink-muted">
          Première visite le {formatDateLabel(insights.firstDate)} · dernière le {formatDateLabel(insights.lastDate)}
        </p>
      )}

      {/* Historique des dépenses */}
      <SectionTitle>Historique des dépenses</SectionTitle>
      <Card>
        {history.length === 0 ? (
          <EmptyState icon="🧾" title="Aucune dépense pour cette enseigne" />
        ) : (
          history.map((e, i) => (
            <div key={e.id}>
              {i > 0 && <div className="my-3 border-t border-surface-muted" />}
              <button
                type="button"
                onClick={() => setOpenExpenseId(e.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{budgetName(e.budgetId)}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDateLabel(e.date)} · {e.paymentSource === "meal_voucher" ? "Tickets resto" : "Compte commun"}
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{formatCents(e.amountCents)}</p>
                <Chevron />
              </button>
            </div>
          ))
        )}
      </Card>

      {/* Actions */}
      <div className="flex gap-2 pt-2 pb-4">
        <button type="button" className="btn-ghost flex-1" onClick={() => setEditing(true)}>
          Modifier
        </button>
        <button
          type="button"
          className="btn-danger flex-1"
          onClick={() => {
            if (typeof window !== "undefined" && !window.confirm("Supprimer cette enseigne ?")) return;
            app.removeMerchant(merchant.id);
            router.push("/admin/merchants");
          }}
        >
          Supprimer
        </button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title="Modifier l'enseigne">
        <MerchantForm merchant={merchant} onDone={() => setEditing(false)} />
      </Sheet>

      <ExpenseSheet expenseId={openExpenseId} onClose={() => setOpenExpenseId(null)} />
    </div>
  );
}
