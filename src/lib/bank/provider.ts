import type { Cents } from "../types";

/** Une transaction bancaire (architecture future de connexion bancaire). */
export interface BankTransaction {
  id: string;
  date: string;
  amountCents: Cents;
  label: string;
  /** Virement entrant susceptible d'être une contribution. */
  isIncoming: boolean;
}

/**
 * Fournisseur de données bancaires. L'application fonctionne avec ou sans
 * connexion bancaire ; aucune banque réelle n'est intégrée pour l'instant.
 */
export interface BankProvider {
  readonly label: string;
  /** Solde du compte commun, ou null si non disponible. */
  getCommonAccountBalance(): Promise<Cents | null>;
  /** Transactions récentes (vide en mode manuel). */
  listTransactions(): Promise<BankTransaction[]>;
}

/** Mode manuel : pas de synchronisation, le solde vient des saisies utilisateur. */
export class ManualBankProvider implements BankProvider {
  readonly label = "Manuel";
  constructor(private readonly manualBalanceCents: Cents | null) {}

  async getCommonAccountBalance(): Promise<Cents | null> {
    return this.manualBalanceCents;
  }

  async listTransactions(): Promise<BankTransaction[]> {
    return [];
  }
}

/** Fournisseur de démonstration : renvoie des données fictives. */
export class MockBankProvider implements BankProvider {
  readonly label = "Démo";
  constructor(private readonly balanceCents: Cents = 350000) {}

  async getCommonAccountBalance(): Promise<Cents | null> {
    return this.balanceCents;
  }

  async listTransactions(): Promise<BankTransaction[]> {
    return [
      { id: "tx_1", date: "2026-06-03", amountCents: -8540, label: "Carrefour", isIncoming: false },
      { id: "tx_2", date: "2026-06-01", amountCents: 120000, label: "Virement salaire", isIncoming: true },
    ];
  }
}
