/**
 * Modèle de données de l'application "comptes-couple-app".
 *
 * Règles transverses :
 * - Tous les montants sont stockés en centimes (entiers).
 * - Toute donnée est rattachée à un foyer (householdId).
 * - Le mois est stocké au format stable "YYYY-MM".
 */

/** Identifiant de mois au format "YYYY-MM" (ex : "2026-06"). */
export type Month = string;

/** Montant exprimé en centimes (entier). */
export type Cents = number;

/** Code devise ISO (par défaut "EUR"). */
export type CurrencyCode = string;

// ---------------------------------------------------------------------------
// Foyer & utilisateurs
// ---------------------------------------------------------------------------

export type MemberRole = "owner" | "admin" | "member";

export interface UserProfile {
  id: string;
  householdId: string;
  firstName: string;
  lastName: string;
  email: string;
  /** Data URL ou URL distante (Supabase Storage plus tard). */
  photoUrl?: string;
  /** Format "YYYY-MM-DD". */
  birthDate?: string;
  role: MemberRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Vue d'appartenance d'un utilisateur à un foyer (générique multi-foyer). */
export interface HouseholdMember {
  userId: string;
  householdId: string;
  role: MemberRole;
  active: boolean;
}

export type AppMode = "manual" | "bank" | "demo";

export interface Household {
  id: string;
  name: string;
  currentMonth: Month;
  defaultCurrency: CurrencyCode;
  mode: AppMode;
  /** Solde manuel du compte commun (centimes) si pas de connexion bancaire. */
  manualCommonBalanceCents?: Cents;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Revenus mensuels
// ---------------------------------------------------------------------------

export interface MonthlyIncome {
  id: string;
  householdId: string;
  userId: string;
  month: Month;
  salaryCents: Cents;
  mealVouchersCents: Cents;
  notes?: string;
  /** Date de déclaration "YYYY-MM-DD". */
  declaredAt: string;
  /** Dernier utilisateur ayant modifié la ligne. */
  lastEditedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Budgets & répartition
// ---------------------------------------------------------------------------

export type BudgetType = "monthly" | "annual" | "savings";

export type SplitMode = "prorata" | "custom";

/** Part personnalisée d'un utilisateur, en points de pourcentage (0..100). */
export interface CustomSplitShare {
  userId: string;
  percent: number;
}

export interface BudgetSplitRule {
  mode: SplitMode;
  /** Renseigné uniquement si mode === "custom". Somme attendue = 100. */
  shares?: CustomSplitShare[];
}

export interface Budget {
  id: string;
  householdId: string;
  name: string;
  /**
   * Montant de référence du budget (centimes) :
   * - monthly : montant prévu chaque mois ;
   * - annual  : montant prévu sur l'année ;
   * - savings : montant d'épargne prévu chaque mois.
   */
  amountCents: Cents;
  type: BudgetType;
  /** Pictogramme (emoji ou nom d'icône). */
  icon: string;
  active: boolean;
  /** Ordre d'affichage croissant. */
  order: number;
  splitRule: BudgetSplitRule;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Provisions mensuelles (budgets annuels)
// ---------------------------------------------------------------------------

export type ProvisionSource = "automatic" | "manual";
export type ProvisionKind = "annual_budget_provision";
export type ProvisionStatus = "active" | "ignored" | "adjusted";

/** Contribution calculée d'un utilisateur sur une ligne (centimes). */
export interface UserContribution {
  userId: string;
  amountCents: Cents;
}

export interface MonthlyProvision {
  id: string;
  householdId: string;
  budgetId: string;
  month: Month;
  amountCents: Cents;
  label: string;
  source: ProvisionSource;
  kind: ProvisionKind;
  splitRule: BudgetSplitRule;
  contributions: UserContribution[];
  status: ProvisionStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Enseignes (marchands)
// ---------------------------------------------------------------------------

export type MerchantCategory =
  | "alimentation"
  | "restaurant"
  | "transport"
  | "logement"
  | "loisirs"
  | "sante"
  | "assurance"
  | "abonnement"
  | "shopping"
  | "autre";

export interface Merchant {
  id: string;
  householdId: string;
  name: string;
  address?: string;
  phone?: string;
  category: MerchantCategory;
  /** Budget associé par défaut (pré-rempli à la création d'une dépense). */
  defaultBudgetId?: string;
  /** Coordonnées géographiques (capturées via le GPS de l'appareil). */
  latitude?: number;
  longitude?: number;
  logoUrl?: string;
  photoUrl?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Statistiques d'une enseigne calculées depuis les dépenses liées. */
export interface MerchantStats {
  merchantId: string;
  expenseCount: number;
  lastAmountCents: Cents | null;
  averageAmountCents: Cents | null;
  totalAmountCents: Cents;
}

// ---------------------------------------------------------------------------
// Dépenses
// ---------------------------------------------------------------------------

export type ExpensePaymentSource = "common_account" | "meal_voucher";
export type ExpenseSource = "manual" | "bank" | "import" | "recurring";

export interface Expense {
  id: string;
  householdId: string;
  merchantId?: string;
  userId: string;
  amountCents: Cents;
  currency: CurrencyCode;
  paymentSource: ExpensePaymentSource;
  /** Renseigné si paymentSource === "meal_voucher". */
  mealVoucherUserId?: string;
  splitRule: BudgetSplitRule;
  date: string;
  budgetId?: string;
  note?: string;
  /** Architecture seulement : référence vers un justificatif. */
  receiptUrl?: string;
  /** Étiquettes transverses pour analyser au-delà du budget. */
  tags?: string[];
  /** Dépense planifiée (à venir) : exclue des dépenses réalisées tant que true. */
  planned?: boolean;
  source: ExpenseSource;
  /** Renseigné si la dépense a été générée depuis un abonnement récurrent. */
  recurringId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Dépenses récurrentes (abonnements / charges fixes)
// ---------------------------------------------------------------------------

export interface RecurringExpense {
  id: string;
  householdId: string;
  label: string;
  amountCents: Cents;
  merchantId?: string;
  budgetId?: string;
  /** Utilisateur à qui la dépense est rattachée (payeur). */
  userId: string;
  paymentSource: ExpensePaymentSource;
  splitRule: BudgetSplitRule;
  /** Jour du mois où la dépense est créée (1..28). */
  dayOfMonth: number;
  /** Premier mois d'application "YYYY-MM" (la génération ne remonte pas avant). */
  startMonth: Month;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Objectifs d'épargne
// ---------------------------------------------------------------------------

export interface SavingsGoal {
  id: string;
  householdId: string;
  name: string;
  icon: string;
  targetCents: Cents;
  /** Montant déjà épargné. */
  currentCents: Cents;
  /** Échéance visée "YYYY-MM-DD" (optionnelle). */
  targetDate?: string;
  /** Budget d'épargne associé (optionnel). */
  budgetId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Récapitulatifs calculés
// ---------------------------------------------------------------------------

export interface ContributionSummary {
  userId: string;
  month: Month;
  /** Revenu total de l'utilisateur sur le mois (salaire + TR). */
  incomeTotalCents: Cents;
  /** Part d'apport au foyer (0..1). */
  incomeSharePct: number;
  /** Contribution totale aux budgets sur le mois. */
  contributionTotalCents: Cents;
  /** Argent de poche = revenu total - contribution. */
  remainingTotalCents: Cents;
  /** Reste argent = salaire - part de contribution financée en argent. */
  remainingMoneyCents: Cents;
  /** Reste tickets restaurant. */
  remainingMealVouchersCents: Cents;
}

export interface BudgetProgress {
  budgetId: string;
  /** Montant prévu rapporté au mois (centimes). */
  plannedMonthlyCents: Cents;
  /** Montant réellement dépensé sur le mois (centimes). */
  spentCents: Cents;
  /** Reste = prévu - dépensé. */
  remainingCents: Cents;
  /** Pourcentage d'atteinte (0..1, peut dépasser 1). */
  progress: number;
  status: "normal" | "warning" | "over";
}

export interface MealVoucherBalance {
  userId: string;
  month: Month;
  grantedCents: Cents;
  spentCents: Cents;
  remainingCents: Cents;
}

export interface MonthlyDashboardSummary {
  month: Month;
  householdId: string;
  /** Budget total prévu du mois (mensuels + provisions annuelles + épargne). */
  budgetTotalCents: Cents;
  /** Dépenses réelles du mois liées aux budgets. */
  spentTotalCents: Cents;
  /** Restant sur le budget du mois. */
  remainingBudgetCents: Cents;
  /** Solde du compte commun (synchronisé / estimé / manuel). */
  commonBalanceCents: Cents;
  /** Somme totale alimentant le compte commun ce mois (contributions − tickets restaurant). */
  commonAccountTotalCents: Cents;
  commonBalanceStatus: "synced" | "estimated" | "manual";
  contributions: ContributionSummary[];
  budgetProgress: BudgetProgress[];
  mealVoucherBalances: MealVoucherBalance[];
  /** Identifiants des utilisateurs actifs sans revenu déclaré ce mois. */
  missingIncomeUserIds: string[];
  incomeComplete: boolean;
}

// ---------------------------------------------------------------------------
// Authentification
// ---------------------------------------------------------------------------

export type AuthProvider = "password" | "passkey" | "demo";

export interface AuthUser {
  id: string;
  userId: string;
  email: string;
  provider: AuthProvider;
}

/** Référence d'un identifiant de connexion rapide (WebAuthn) — pas de biométrie stockée. */
export interface PasskeyCredential {
  id: string;
  userId: string;
  /** Identifiant opaque du credential (base64url). */
  credentialId: string;
  label: string;
  createdAt: string;
  lastUsedAt?: string;
}

export type BankConnectionMode = "manual" | "connected" | "demo";

// ---------------------------------------------------------------------------
// Clôture mensuelle (bilan figé)
// ---------------------------------------------------------------------------

export interface MonthClosure {
  id: string;
  householdId: string;
  month: Month;
  closedAt: string;
  budgetTotalCents: Cents;
  spentTotalCents: Cents;
  byBudget: Array<{ budgetId: string; plannedCents: Cents; spentCents: Cents }>;
  /** Virements de rééquilibrage figés à la clôture. */
  settlementTransfers: Array<{ fromUserId: string; toUserId: string; amountCents: Cents }>;
}

// ---------------------------------------------------------------------------
// État applicatif persistant (localStorage)
// ---------------------------------------------------------------------------

export const APP_STATE_VERSION = 6;

// ---------------------------------------------------------------------------
// Connexion bancaire (agrégation PSD2 — fournisseur GoCardless Bank Account Data)
// ---------------------------------------------------------------------------

/** Fournisseur d'agrégation. `demo` = données fictives tant qu'aucune clé n'est configurée. */
export type BankProviderId = "gocardless" | "demo";

export type BankConnectionStatus = "pending" | "linked" | "error";

/** Un compte bancaire rattaché à la connexion. */
export interface BankAccountLink {
  /** Identifiant du compte chez le fournisseur. */
  id: string;
  name?: string;
  iban?: string;
  currency?: CurrencyCode;
  /** Dernier solde synchronisé (centimes). */
  balanceCents?: Cents;
}

/** Connexion à une banque (une requisition GoCardless). Aucun secret stocké ici. */
export interface BankConnection {
  provider: BankProviderId;
  /** Identifiant de l'établissement (ex. "ING_INGBBEBB"). */
  institutionId: string;
  institutionName: string;
  /** Identifiant de la requisition côté fournisseur. */
  requisitionId: string;
  status: BankConnectionStatus;
  accounts: BankAccountLink[];
  /** Compte choisi comme « compte commun » pour la synchro du solde. */
  commonAccountId?: string;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Transaction importée depuis la banque, en attente de rapprochement. */
export interface PendingBankTransaction {
  /** Identifiant fournisseur (clé de déduplication). */
  id: string;
  accountId: string;
  /** Format "YYYY-MM-DD". */
  date: string;
  /** Montant signé (négatif = débit). */
  amountCents: Cents;
  label: string;
  status: "pending" | "imported" | "dismissed";
  /** Dépense créée lors de l'import, le cas échéant. */
  expenseId?: string;
}

export interface LocalAppState {
  version: number;
  household: Household;
  users: UserProfile[];
  incomes: MonthlyIncome[];
  budgets: Budget[];
  provisions: MonthlyProvision[];
  merchants: Merchant[];
  expenses: Expense[];
  recurringExpenses: RecurringExpense[];
  /** Clés "recurringId:YYYY-MM" déjà matérialisées (anti-doublon, append-only). */
  materializedRecurring: string[];
  savingsGoals: SavingsGoal[];
  monthClosures: MonthClosure[];
  passkeys: PasskeyCredential[];
  /** Connexion bancaire active (null si aucune). */
  bankConnection: BankConnection | null;
  /** Transactions bancaires importées, en attente de rapprochement. */
  bankTransactions: PendingBankTransaction[];
  /** Onboarding terminé. */
  onboardingComplete: boolean;
  /** Utilisateur connecté (mode demo/local). */
  currentUserId: string | null;
}
