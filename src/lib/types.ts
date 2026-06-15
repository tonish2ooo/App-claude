/**
 * Modèle de données de l'application "App Courses".
 *
 * Règles transverses :
 * - Tous les prix sont stockés en centimes (entiers).
 * - Les données sont rattachées à un foyer partagé (householdId) afin de
 *   permettre une liste de courses commune à plusieurs utilisateurs.
 */

/** Prix exprimé en centimes (entier). */
export type Cents = number;

/** Identifiant de mois au format "YYYY-MM" (conservé pour les utilitaires de date). */
export type Month = string;

/** Code devise ISO (par défaut "EUR"). */
export type CurrencyCode = string;

// ---------------------------------------------------------------------------
// Foyer & utilisateurs
// ---------------------------------------------------------------------------

/** Un utilisateur qui partage la liste de courses commune. */
export interface Shopper {
  id: string;
  householdId: string;
  name: string;
  /** Emoji d'avatar (ex : "🧑‍🍳"). */
  emoji: string;
  /** Couleur d'accent (hex) utilisée pour identifier ses ajouts. */
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: string;
  name: string;
  defaultCurrency: CurrencyCode;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Catégories & tickets restaurant
// ---------------------------------------------------------------------------

/** Rayons de courses. */
export type ProductCategory =
  | "fruits_legumes"
  | "boulangerie"
  | "cremerie"
  | "viande_poisson"
  | "epicerie_salee"
  | "epicerie_sucree"
  | "plats_prepares"
  | "boissons"
  | "alcool"
  | "surgeles"
  | "hygiene"
  | "entretien"
  | "bebe"
  | "animaux"
  | "maison"
  | "autre";

/**
 * Éligibilité d'un produit au paiement par titre-restaurant (France).
 * - "eligible"    : alimentaire directement consommable / préparable ;
 * - "ineligible"  : non alimentaire, alcool, etc. ;
 * - "unknown"     : impossible de trancher automatiquement.
 */
export type TicketRestoEligibility = "eligible" | "ineligible" | "unknown";

// ---------------------------------------------------------------------------
// Base de données produits
// ---------------------------------------------------------------------------

/** Fiche produit (base de données réutilisable entre les listes). */
export interface Product {
  id: string;
  householdId: string;
  /** Nom descriptif (ex : "Lait demi-écrémé 1L"). */
  name: string;
  description?: string;
  category: ProductCategory;
  /** Marque (optionnelle). */
  brand?: string;
  /** Prix de référence en centimes (dernier prix connu). */
  priceCents?: Cents;
  /** Unité de référence (ex : "L", "kg", "pièce"). */
  unit?: string;
  /** Code-barres EAN (optionnel). */
  barcode?: string;
  /** Image (data URL ou URL distante). */
  imageUrl?: string;
  /**
   * Éligibilité titre-restaurant. Déduite automatiquement à la création puis
   * éventuellement corrigée manuellement (`ticketRestoOverridden`).
   */
  ticketResto: TicketRestoEligibility;
  /** L'éligibilité a-t-elle été fixée manuellement par un utilisateur ? */
  ticketRestoOverridden: boolean;
  /** Nombre de fois où le produit a été ajouté à une liste (popularité). */
  timesAdded: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Liste de courses
// ---------------------------------------------------------------------------

/** Une ligne de la liste de courses commune. */
export interface ListItem {
  id: string;
  householdId: string;
  /** Référence vers la fiche produit (si rattachée). */
  productId?: string;
  /** Libellé saisi/dicté (toujours présent, même sans fiche produit). */
  label: string;
  quantity: number;
  unit?: string;
  /** Catégorie (héritée du produit ou déduite du libellé). */
  category: ProductCategory;
  ticketResto: TicketRestoEligibility;
  /** Article coché (mis au panier / acheté). */
  checked: boolean;
  note?: string;
  /** Utilisateur ayant ajouté la ligne. */
  addedByShopperId: string | null;
  /** Provenance : dictée vocale, saisie manuelle ou fiche produit. */
  source: "voice" | "manual" | "catalog";
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Filtre d'affichage
// ---------------------------------------------------------------------------

/** Filtre tickets restaurant appliqué à l'affichage de la liste. */
export type TicketRestoFilter = "all" | "eligible_only" | "ineligible_only";

export interface ListFilters {
  ticketResto: TicketRestoFilter;
  /** Masquer les articles déjà cochés. */
  hideChecked: boolean;
}

// ---------------------------------------------------------------------------
// État applicatif persistant (localStorage / Supabase)
// ---------------------------------------------------------------------------

export const APP_STATE_VERSION = 1;

export interface LocalAppState {
  version: number;
  household: Household;
  shoppers: Shopper[];
  products: Product[];
  items: ListItem[];
  filters: ListFilters;
  /** Utilisateur courant (sélectionné au démarrage). */
  currentShopperId: string | null;
  /** Onboarding terminé (au moins un utilisateur créé). */
  onboardingComplete: boolean;
  /**
   * Version du catalogue de produits déjà fusionnée dans la base. Permet
   * d'injecter une seule fois les produits issus des tickets de caisse, y
   * compris dans un état sauvegardé par une version antérieure.
   */
  catalogVersion?: number;
}
