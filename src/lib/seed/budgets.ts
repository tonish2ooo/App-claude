import type { Budget } from "../types";

/**
 * Liste de budgets "prêts à l'emploi" pour un foyer.
 *
 * Les postes et montants proviennent du plan de dépenses mensuel du foyer.
 * Tous les montants sont en centimes (entiers). Les pictogrammes sont choisis
 * pour rester lisibles d'un coup d'œil dans l'interface.
 */
interface BudgetPreset {
  id: string;
  name: string;
  amountCents: number;
  type: Budget["type"];
  icon: string;
}

const PRESETS: BudgetPreset[] = [
  { id: "budget_loyer", name: "Loyer/Crédit", amountCents: 197563, type: "monthly", icon: "🏠" },
  { id: "budget_assurance_solde", name: "Assurance solde restant dû", amountCents: 12012, type: "monthly", icon: "🛡️" },
  { id: "budget_per", name: "Plan épargne retraite", amountCents: 8750, type: "savings", icon: "🏦" },
  { id: "budget_courses", name: "Courses", amountCents: 80000, type: "monthly", icon: "🛒" },
  { id: "budget_assurance_maison", name: "Assurance maison", amountCents: 5904, type: "monthly", icon: "🏡" },
  { id: "budget_restaurant", name: "Restaurant", amountCents: 20000, type: "monthly", icon: "🍽️" },
  { id: "budget_boucherie", name: "Boucherie", amountCents: 30000, type: "monthly", icon: "🥩" },
  { id: "budget_voiture", name: "Voiture", amountCents: 76291, type: "monthly", icon: "🚗" },
  { id: "budget_electricite", name: "Électricité", amountCents: 11469, type: "monthly", icon: "⚡" },
  { id: "budget_eau", name: "Eau", amountCents: 4360, type: "monthly", icon: "💧" },
  { id: "budget_drink_market", name: "Drink Market", amountCents: 16000, type: "monthly", icon: "🥤" },
  { id: "budget_ecole", name: "Louloute école", amountCents: 10000, type: "monthly", icon: "🎒" },
  { id: "budget_galipettes", name: "Galipettes", amountCents: 12000, type: "monthly", icon: "🤸" },
  { id: "budget_internet", name: "Internet/Abonnements", amountCents: 5000, type: "monthly", icon: "📶" },
  { id: "budget_charge_voiture", name: "Charge voiture", amountCents: 6000, type: "monthly", icon: "🔌" },
  { id: "budget_verisure", name: "Verisure", amountCents: 5829, type: "monthly", icon: "🔒" },
  { id: "budget_vetements", name: "Vêtements Léonie", amountCents: 10000, type: "monthly", icon: "👕" },
  { id: "budget_autre", name: "Autre", amountCents: 10000, type: "monthly", icon: "📦" },
];

/**
 * Construit la liste de budgets par défaut pour un foyer donné.
 * La répartition est au prorata des revenus par défaut.
 */
export function buildPresetBudgets(householdId: string, now: string): Budget[] {
  return PRESETS.map((preset, index) => ({
    id: preset.id,
    householdId,
    name: preset.name,
    amountCents: preset.amountCents,
    type: preset.type,
    icon: preset.icon,
    active: true,
    order: index + 1,
    splitRule: { mode: "prorata" },
    createdAt: now,
    updatedAt: now,
  }));
}
