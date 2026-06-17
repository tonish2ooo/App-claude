/**
 * Client serveur pour GoCardless Bank Account Data (agrégation PSD2).
 *
 * À n'importer que depuis des route handlers (code serveur) : les secrets ne
 * doivent jamais être inclus dans un bundle client.
 *
 * Les identifiants sont lus exclusivement depuis l'environnement
 * (GOCARDLESS_SECRET_ID / GOCARDLESS_SECRET_KEY) et ne transitent JAMAIS par le
 * client. Tant qu'ils ne sont pas configurés, les routes basculent en mode démo.
 *
 * Docs : https://developer.gocardless.com/bank-account-data
 */

const BASE = "https://bankaccountdata.gocardless.com/api/v2";

export function isConfigured(): boolean {
  return Boolean(process.env.GOCARDLESS_SECRET_ID && process.env.GOCARDLESS_SECRET_KEY);
}

// Cache mémoire du jeton d'accès (court-lived), régénéré à la demande.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const res = await fetch(`${BASE}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      secret_id: process.env.GOCARDLESS_SECRET_ID,
      secret_key: process.env.GOCARDLESS_SECRET_KEY,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GoCardless token error (${res.status})`);
  const json = (await res.json()) as { access: string; access_expires: number };
  cachedToken = { value: json.access, expiresAt: Date.now() + json.access_expires * 1000 };
  return cachedToken.value;
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GoCardless ${path} error (${res.status}): ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function toCents(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

export interface RawAccount {
  id: string;
  name?: string;
  iban?: string;
  currency?: string;
  balanceCents?: number;
}

export interface RawTransaction {
  id: string;
  date: string;
  amountCents: number;
  label: string;
}

/** Crée une requisition et renvoie le lien de consentement à ouvrir. */
export async function createRequisition(
  institutionId: string,
  redirect: string,
  reference: string,
): Promise<{ requisitionId: string; link: string }> {
  const json = await api<{ id: string; link: string }>("/requisitions/", {
    method: "POST",
    body: JSON.stringify({ institution_id: institutionId, redirect, reference }),
  });
  return { requisitionId: json.id, link: json.link };
}

/** Liste les comptes rattachés à une requisition (après consentement). */
export async function listRequisitionAccounts(requisitionId: string): Promise<RawAccount[]> {
  const req = await api<{ accounts: string[]; status: string }>(`/requisitions/${requisitionId}/`);
  const accounts: RawAccount[] = [];
  for (const id of req.accounts ?? []) {
    const [details, balances] = await Promise.all([
      api<{ account?: { iban?: string; name?: string; currency?: string } }>(`/accounts/${id}/details/`).catch(
        () => ({ account: undefined }),
      ),
      api<{ balances?: Array<{ balanceAmount: { amount: string; currency: string }; balanceType: string }> }>(
        `/accounts/${id}/balances/`,
      ).catch(() => ({ balances: [] })),
    ]);
    const bal = balances.balances?.find((b) => /closingBooked|expected|interimAvailable/i.test(b.balanceType))
      ?? balances.balances?.[0];
    accounts.push({
      id,
      name: details.account?.name,
      iban: details.account?.iban,
      currency: details.account?.currency ?? bal?.balanceAmount.currency,
      balanceCents: bal ? toCents(bal.balanceAmount.amount) : undefined,
    });
  }
  return accounts;
}

/** Récupère le solde courant et les transactions récentes d'un compte. */
export async function fetchAccountData(
  accountId: string,
): Promise<{ balanceCents: number | null; transactions: RawTransaction[] }> {
  const [balances, txs] = await Promise.all([
    api<{ balances?: Array<{ balanceAmount: { amount: string }; balanceType: string }> }>(
      `/accounts/${accountId}/balances/`,
    ),
    api<{
      transactions?: {
        booked?: Array<Record<string, unknown>>;
        pending?: Array<Record<string, unknown>>;
      };
    }>(`/accounts/${accountId}/transactions/`),
  ]);

  const bal = balances.balances?.find((b) => /closingBooked|expected|interimAvailable/i.test(b.balanceType))
    ?? balances.balances?.[0];

  const booked = txs.transactions?.booked ?? [];
  const transactions: RawTransaction[] = booked.map((t, i) => {
    const amount = (t.transactionAmount as { amount?: string } | undefined)?.amount ?? "0";
    const date =
      (t.bookingDate as string | undefined) ?? (t.valueDate as string | undefined) ?? new Date().toISOString().slice(0, 10);
    const label =
      (t.remittanceInformationUnstructured as string | undefined) ??
      ((t.remittanceInformationUnstructuredArray as string[] | undefined)?.join(" ")) ??
      (t.creditorName as string | undefined) ??
      (t.debtorName as string | undefined) ??
      "Transaction";
    const id =
      (t.transactionId as string | undefined) ??
      (t.internalTransactionId as string | undefined) ??
      `${accountId}_${date}_${amount}_${i}`;
    return { id, date, amountCents: toCents(amount), label };
  });

  return { balanceCents: bal ? toCents(bal.balanceAmount.amount) : null, transactions };
}
