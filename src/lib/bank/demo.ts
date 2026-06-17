import type { RawAccount, RawTransaction } from "@/lib/bank/gocardless";

/**
 * Données fictives utilisées tant qu'aucune clé d'agrégateur n'est configurée.
 * Permet de dérouler tout le parcours de connexion en développement.
 */

export function demoAccounts(): RawAccount[] {
  return [
    { id: "demo_acc_common", name: "Compte courant", iban: "BE68•••• ••••2345", currency: "EUR", balanceCents: 284530 },
  ];
}

export function demoAccountData(accountId: string): { balanceCents: number; transactions: RawTransaction[] } {
  const today = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  };
  return {
    balanceCents: 284530,
    transactions: [
      { id: `${accountId}_tx1`, date: iso(1), amountCents: -4290, label: "Delhaize" },
      { id: `${accountId}_tx2`, date: iso(2), amountCents: -1990, label: "Abonnement streaming" },
      { id: `${accountId}_tx3`, date: iso(3), amountCents: -6540, label: "Station-service" },
      { id: `${accountId}_tx4`, date: iso(5), amountCents: 245000, label: "Virement salaire" },
      { id: `${accountId}_tx5`, date: iso(6), amountCents: -3210, label: "Pharmacie" },
    ],
  };
}
