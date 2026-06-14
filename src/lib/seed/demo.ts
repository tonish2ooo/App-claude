import { currentMonth, previousMonth, todayIso } from "../date";
import { generateMonthlyAnnualBudgetProvisions } from "../calc/provisions";
import { makeId } from "../id";
import { APP_STATE_VERSION, type LocalAppState } from "../types";
import { buildPresetBudgets } from "./budgets";

/**
 * Construit un état de démonstration cohérent.
 * Les utilisateurs sont des données (jamais codés en dur dans les composants).
 */
export function buildDemoState(): LocalAppState {
  const now = new Date().toISOString();
  const month = currentMonth();
  const prev = previousMonth(month);
  const householdId = "house_demo";

  const u1 = "user_demo_1";
  const u2 = "user_demo_2";

  const users: LocalAppState["users"] = [
    {
      id: u1,
      householdId,
      firstName: "Anthony",
      lastName: "",
      email: "anthony@foyer.demo",
      role: "owner",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: u2,
      householdId,
      firstName: "Carole",
      lastName: "",
      email: "carole@foyer.demo",
      role: "admin",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const incomes: LocalAppState["incomes"] = [
    {
      id: makeId("inc"),
      householdId,
      userId: u1,
      month,
      salaryCents: 397399,
      mealVouchersCents: 25200,
      declaredAt: todayIso(),
      lastEditedByUserId: u1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: makeId("inc"),
      householdId,
      userId: u2,
      month,
      salaryCents: 324804,
      mealVouchersCents: 17000,
      declaredAt: todayIso(),
      lastEditedByUserId: u2,
      createdAt: now,
      updatedAt: now,
    },
    // Mois précédent (pour la duplication).
    {
      id: makeId("inc"),
      householdId,
      userId: u1,
      month: prev,
      salaryCents: 397399,
      mealVouchersCents: 25200,
      declaredAt: `${prev}-05`,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const budgets: LocalAppState["budgets"] = buildPresetBudgets(householdId, now);

  const merchants: LocalAppState["merchants"] = [
    {
      id: "merchant_carrefour",
      householdId,
      name: "Carrefour",
      category: "alimentation",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "merchant_resto",
      householdId,
      name: "Le Bistrot",
      category: "restaurant",
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const expenses: LocalAppState["expenses"] = [
    {
      id: makeId("exp"),
      householdId,
      merchantId: "merchant_carrefour",
      userId: u1,
      amountCents: 8540,
      currency: "EUR",
      paymentSource: "common_account",
      splitRule: { mode: "prorata" },
      date: todayIso(),
      budgetId: "budget_courses",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: makeId("exp"),
      householdId,
      merchantId: "merchant_resto",
      userId: u2,
      amountCents: 2400,
      currency: "EUR",
      paymentSource: "meal_voucher",
      mealVoucherUserId: u2,
      splitRule: { mode: "prorata" },
      date: todayIso(),
      budgetId: "budget_courses",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const provisions = generateMonthlyAnnualBudgetProvisions({
    budgets,
    month,
    existingProvisions: [],
    activeUsers: users,
    incomes,
    now,
  });

  return {
    version: APP_STATE_VERSION,
    household: {
      id: householdId,
      name: "Foyer démo",
      currentMonth: month,
      defaultCurrency: "EUR",
      mode: "demo",
      manualCommonBalanceCents: 350000,
      createdAt: now,
      updatedAt: now,
    },
    users,
    incomes,
    budgets,
    provisions,
    merchants,
    expenses,
    passkeys: [],
    onboardingComplete: true,
    currentUserId: u1,
  };
}

/** État initial vide pour un nouveau foyer (avant onboarding). */
export function buildEmptyState(): LocalAppState {
  const now = new Date().toISOString();
  const month = currentMonth();
  return {
    version: APP_STATE_VERSION,
    household: {
      id: makeId("house"),
      name: "Mon foyer",
      currentMonth: month,
      defaultCurrency: "EUR",
      mode: "manual",
      manualCommonBalanceCents: 0,
      createdAt: now,
      updatedAt: now,
    },
    users: [],
    incomes: [],
    budgets: [],
    provisions: [],
    merchants: [],
    expenses: [],
    passkeys: [],
    onboardingComplete: false,
    currentUserId: null,
  };
}
