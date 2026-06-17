"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/state/AppStateContext";
import { Card } from "@/components/ui/primitives";
import { Sheet } from "@/components/ui/Sheet";
import { Field, Select } from "@/components/ui/fields";
import { formatCents } from "@/lib/money";
import { formatDateLabel } from "@/lib/date";
import {
  INSTITUTIONS,
  connectBank,
  fetchAccountData,
  fetchAccounts,
  toPendingTransactions,
} from "@/lib/bank/client";
import type { BankAccountLink } from "@/lib/types";

type Busy = null | "connecting" | "finishing" | "syncing";

export function BankLink() {
  const app = useAppState();
  const conn = app.state.bankConnection;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [institutionId, setInstitutionId] = useState(INSTITUTIONS[0]?.id ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const handledCallback = useRef(false);

  // Récupère solde + transactions de chaque compte ; renvoie les comptes mis à jour.
  async function syncAccounts(accounts: BankAccountLink[]): Promise<BankAccountLink[]> {
    const updated = [...accounts];
    let existing = app.state.bankTransactions;
    let added = 0;
    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      if (!acc) continue;
      const data = await fetchAccountData(acc.id);
      if (data.balanceCents != null) updated[i] = { ...acc, balanceCents: data.balanceCents };
      const pend = toPendingTransactions(acc.id, data.transactions, existing);
      if (pend.length) {
        app.mergeBankTransactions(pend);
        existing = [...existing, ...pend];
        added += pend.length;
      }
    }
    setInfo(added > 0 ? `${added} transaction(s) à rapprocher` : "Aucune nouvelle transaction");
    return updated;
  }

  // Termine la connexion après le consentement : récupère les comptes puis synchronise.
  async function finish(requisitionId: string) {
    setBusy("finishing");
    setError(null);
    try {
      const accounts = await fetchAccounts(requisitionId);
      const synced = await syncAccounts(accounts);
      app.updateBankConnection({
        status: "linked",
        accounts: synced,
        commonAccountId: synced[0]?.id,
        lastSyncAt: new Date().toISOString(),
      });
      app.updateHousehold({ mode: "bank" });
    } catch (e) {
      app.updateBankConnection({ status: "error" });
      setError(e instanceof Error ? e.message : "Connexion impossible");
    } finally {
      setBusy(null);
    }
  }

  // Détecte le retour de consentement (redirection) et finalise une connexion en attente.
  useEffect(() => {
    if (handledCallback.current) return;
    if (searchParams.get("bank") !== "callback") return;
    handledCallback.current = true;
    router.replace(pathname);
    if (conn && conn.status === "pending") void finish(conn.requisitionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function connect() {
    const inst = INSTITUTIONS.find((i) => i.id === institutionId);
    if (!inst) return;
    setBusy("connecting");
    setError(null);
    const redirectUrl = `${window.location.origin}${pathname}`;
    try {
      const res = await connectBank(inst.id, redirectUrl);
      const nowIso = new Date().toISOString();
      app.setBankConnection({
        provider: res.demo ? "demo" : "gocardless",
        institutionId: inst.id,
        institutionName: inst.name,
        requisitionId: res.requisitionId,
        status: "pending",
        accounts: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      setPickerOpen(false);
      if (res.demo) {
        await finish(res.requisitionId);
      } else {
        window.location.href = res.link;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connexion impossible");
      setBusy(null);
    }
  }

  async function syncNow() {
    if (!conn) return;
    setBusy("syncing");
    setError(null);
    try {
      const synced = await syncAccounts(conn.accounts);
      app.updateBankConnection({ accounts: synced, lastSyncAt: new Date().toISOString() });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Synchronisation impossible");
    } finally {
      setBusy(null);
    }
  }

  function disconnect() {
    if (typeof window !== "undefined" && !window.confirm("Déconnecter la banque ?")) return;
    app.setBankConnection(null);
    app.updateHousehold({ mode: "manual" });
    setInfo(null);
    setError(null);
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Connexion bancaire</p>
        {conn?.status === "linked" && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-ok">Connectée</span>
        )}
      </div>

      {!conn && (
        <>
          <p className="text-xs text-ink-muted">
            Connectez votre banque pour synchroniser le solde du compte commun et importer vos transactions.
          </p>
          <button type="button" className="btn-primary w-full" onClick={() => setPickerOpen(true)} disabled={busy != null}>
            Connecter ma banque
          </button>
        </>
      )}

      {conn?.status === "pending" && (
        <>
          <p className="text-xs text-ink-muted">
            Connexion à {conn.institutionName} en cours…
          </p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => void finish(conn.requisitionId)}
            disabled={busy != null}
          >
            {busy === "finishing" ? "Finalisation…" : "Terminer la connexion"}
          </button>
        </>
      )}

      {conn?.status === "error" && (
        <button type="button" className="btn-primary w-full" onClick={() => void finish(conn.requisitionId)}>
          Réessayer
        </button>
      )}

      {conn?.status === "linked" && (
        <>
          <p className="text-xs text-ink-muted">
            {conn.institutionName}
            {conn.lastSyncAt ? ` · synchro ${formatDateLabel(conn.lastSyncAt.slice(0, 10))}` : ""}
          </p>

          <div className="space-y-2">
            {conn.accounts.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-surface-subtle p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name ?? "Compte"}</p>
                  {a.iban && <p className="text-[11px] text-ink-muted">{a.iban}</p>}
                </div>
                <p className="shrink-0 text-sm font-semibold">
                  {a.balanceCents != null ? formatCents(a.balanceCents) : "—"}
                </p>
              </div>
            ))}
          </div>

          {conn.accounts.length > 1 && (
            <Field label="Compte commun (pour le solde affiché)">
              <Select
                value={conn.commonAccountId ?? ""}
                onChange={(e) => app.updateBankConnection({ commonAccountId: e.target.value })}
              >
                {conn.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name ?? a.id}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1" onClick={() => void syncNow()} disabled={busy != null}>
              {busy === "syncing" ? "Synchronisation…" : "Synchroniser"}
            </button>
            <button type="button" className="btn-danger flex-1" onClick={disconnect} disabled={busy != null}>
              Déconnecter
            </button>
          </div>
        </>
      )}

      {conn?.provider === "demo" && (
        <p className="text-[11px] text-ink-muted">
          Mode démonstration — données fictives. Configurez les clés de l'agrégateur dans l'environnement pour
          connecter une vraie banque.
        </p>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
      {info && !error && <p className="text-xs text-ink-muted">{info}</p>}

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Choisir la banque">
        <div className="space-y-3">
          <Field label="Banque">
            <Select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
              {INSTITUTIONS.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </Select>
          </Field>
          <button type="button" className="btn-primary w-full" onClick={() => void connect()} disabled={busy != null}>
            {busy === "connecting" ? "Connexion…" : "Continuer"}
          </button>
          <p className="text-[11px] text-ink-muted">
            Vous serez redirigé vers votre banque pour autoriser l'accès en lecture seule.
          </p>
        </div>
      </Sheet>
    </Card>
  );
}
