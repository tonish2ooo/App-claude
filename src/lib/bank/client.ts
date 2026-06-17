import type { BankAccountLink, PendingBankTransaction } from "@/lib/types";

/** Établissements proposés au choix (Belgique en priorité — identifiants GoCardless). */
export interface Institution {
  id: string;
  name: string;
}

export const INSTITUTIONS: Institution[] = [
  { id: "ING_INGBBEBB", name: "ING Belgique" },
  { id: "KBC_KREDBEBB", name: "KBC" },
  { id: "BELFIUS_GKCCBEBB", name: "Belfius" },
  { id: "BNP_PARIBAS_FORTIS_GEBABEBB", name: "BNP Paribas Fortis" },
];

export interface ConnectResult {
  demo: boolean;
  requisitionId: string;
  link: string;
  reference: string;
}

/** Démarre la connexion : renvoie le lien de consentement (et un drapeau démo). */
export async function connectBank(institutionId: string, redirectUrl: string): Promise<ConnectResult> {
  const res = await fetch("/api/bank/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ institutionId, redirectUrl }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Connexion impossible");
  return json as ConnectResult;
}

/** Récupère les comptes rattachés après consentement. */
export async function fetchAccounts(requisitionId: string): Promise<BankAccountLink[]> {
  const res = await fetch(`/api/bank/accounts?requisitionId=${encodeURIComponent(requisitionId)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Comptes indisponibles");
  return (json.accounts ?? []) as BankAccountLink[];
}

export interface AccountData {
  balanceCents: number | null;
  transactions: Array<{ id: string; date: string; amountCents: number; label: string }>;
}

/** Récupère solde + transactions d'un compte. */
export async function fetchAccountData(accountId: string): Promise<AccountData> {
  const res = await fetch(`/api/bank/data?accountId=${encodeURIComponent(accountId)}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Données indisponibles");
  return { balanceCents: json.balanceCents ?? null, transactions: json.transactions ?? [] };
}

/** Construit les transactions à rapprocher depuis un lot brut, en évitant les doublons. */
export function toPendingTransactions(
  accountId: string,
  raw: AccountData["transactions"],
  existing: PendingBankTransaction[],
): PendingBankTransaction[] {
  const known = new Set(existing.map((t) => t.id));
  return raw
    .filter((t) => !known.has(t.id))
    .map((t) => ({
      id: t.id,
      accountId,
      date: t.date,
      amountCents: t.amountCents,
      label: t.label,
      status: "pending" as const,
    }));
}
