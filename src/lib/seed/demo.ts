import { currentMonth, lastNMonths, previousMonth, todayIso } from "../date";
import { generateMonthlyAnnualBudgetProvisions } from "../calc/provisions";
import { budgetProgressForMonth, budgetTotalForMonth } from "../calc/dashboard";
import { spentTotalForMonth } from "../calc/expenses";
import { computeSettlement } from "../calc/settlement";
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

  // Revenus sur 6 mois (mois courant exact, petites variations de TR avant)
  // pour alimenter les courbes d'évolution et les moyennes.
  const incomeMonths = lastNMonths(month, 6);
  const incomes: LocalAppState["incomes"] = [];
  incomeMonths.forEach((m, idx) => {
    const isCurrent = m === month;
    incomes.push({
      id: makeId("inc"),
      householdId,
      userId: u1,
      month: m,
      salaryCents: 397399,
      mealVouchersCents: isCurrent ? 25200 : 23400 + (idx % 3) * 600,
      declaredAt: isCurrent ? todayIso() : `${m}-05`,
      lastEditedByUserId: u1,
      createdAt: now,
      updatedAt: now,
    });
    incomes.push({
      id: makeId("inc"),
      householdId,
      userId: u2,
      month: m,
      salaryCents: 324804,
      mealVouchersCents: isCurrent ? 17000 : 15800 + (idx % 2) * 800,
      declaredAt: isCurrent ? todayIso() : `${m}-05`,
      lastEditedByUserId: u2,
      createdAt: now,
      updatedAt: now,
    });
  });

  const budgets: LocalAppState["budgets"] = buildPresetBudgets(householdId, now);

  const merchants: LocalAppState["merchants"] = [
    {
      id: "merchant_carrefour",
      householdId,
      name: "Carrefour",
      category: "alimentation",
      defaultBudgetId: "budget_courses",
      address: "2 Avenue de la République, 59650 Villeneuve-d'Ascq",
      latitude: 50.6311,
      longitude: 3.1469,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "merchant_resto",
      householdId,
      name: "Le Bistrot",
      category: "restaurant",
      defaultBudgetId: "budget_restaurant",
      address: "12 Place du Général de Gaulle, 59000 Lille",
      latitude: 50.6366,
      longitude: 3.0635,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Dépenses réelles de juin (colonne « Réel compte » du tableau), payées
  // depuis le compte commun et rattachées aux budgets correspondants.
  const realExpenses: Array<{ budgetId: string; amountCents: number; merchantId?: string; tags?: string[] }> = [
    { budgetId: "budget_loyer", amountCents: 197563 },
    { budgetId: "budget_assurance_solde", amountCents: 12012 },
    { budgetId: "budget_courses", amountCents: 60802, merchantId: "merchant_carrefour" },
    { budgetId: "budget_assurance_maison", amountCents: 6202 },
    { budgetId: "budget_restaurant", amountCents: 13921, merchantId: "merchant_resto", tags: ["sortie"] },
    { budgetId: "budget_boucherie", amountCents: 3556 },
    { budgetId: "budget_voiture", amountCents: 76291 },
    { budgetId: "budget_eau", amountCents: 4360 },
    { budgetId: "budget_drink_market", amountCents: 8495 },
    { budgetId: "budget_ecole", amountCents: 8700, tags: ["enfants"] },
    { budgetId: "budget_galipettes", amountCents: 9350, tags: ["enfants", "loisir"] },
    { budgetId: "budget_charge_voiture", amountCents: 5502 },
    { budgetId: "budget_verisure", amountCents: 5829 },
    { budgetId: "budget_vetements", amountCents: 17690, tags: ["enfants"] },
    { budgetId: "budget_autre", amountCents: 13219 },
  ];

  // Justificatif fictif (image SVG en data URL) pour illustrer la photo de reçu.
  const receiptSvg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='240' height='320'>" +
    "<rect width='240' height='320' fill='#ffffff'/>" +
    "<text x='20' y='44' font-family='monospace' font-size='18' fill='#111'>CARREFOUR</text>" +
    "<text x='20' y='84' font-family='monospace' font-size='13' fill='#444'>Courses</text>" +
    "<line x1='20' y1='100' x2='220' y2='100' stroke='#ccc'/>" +
    "<text x='20' y='140' font-family='monospace' font-size='13' fill='#444'>Articles ......... 55,30</text>" +
    "<text x='20' y='168' font-family='monospace' font-size='13' fill='#444'>TVA ..............  5,52</text>" +
    "<line x1='20' y1='190' x2='220' y2='190' stroke='#ccc'/>" +
    "<text x='20' y='226' font-family='monospace' font-size='17' fill='#111'>TOTAL  60,82 EUR</text>" +
    "</svg>";
  const receiptDataUrl = `data:image/svg+xml,${encodeURIComponent(receiptSvg)}`;

  const currentExpenses: LocalAppState["expenses"] = realExpenses.map((e, i) => ({
    id: makeId("exp"),
    householdId,
    merchantId: e.merchantId,
    userId: i % 2 === 0 ? u1 : u2,
    amountCents: e.amountCents,
    currency: "EUR",
    paymentSource: "common_account",
    splitRule: { mode: "prorata" },
    date: `${month}-${String((i % 26) + 2).padStart(2, "0")}`,
    budgetId: e.budgetId,
    source: "manual",
    tags: e.tags,
    receiptUrl: e.budgetId === "budget_courses" ? receiptDataUrl : undefined,
    createdAt: now,
    updatedAt: now,
  }));

  // Tickets restaurant utilisés ce mois-ci (pour montrer le solde TR par personne).
  const mealCurrent: LocalAppState["expenses"] = [
    {
      id: makeId("exp"),
      householdId,
      merchantId: "merchant_resto",
      userId: u1,
      amountCents: 1800,
      currency: "EUR",
      paymentSource: "meal_voucher",
      mealVoucherUserId: u1,
      splitRule: { mode: "prorata" },
      date: `${month}-08`,
      budgetId: "budget_restaurant",
      source: "manual",
      tags: ["midi"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: makeId("exp"),
      householdId,
      userId: u2,
      amountCents: 1240,
      currency: "EUR",
      paymentSource: "meal_voucher",
      mealVoucherUserId: u2,
      splitRule: { mode: "prorata" },
      date: `${month}-12`,
      budgetId: "budget_courses",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Dépense planifiée (à venir) — exclue des dépenses réalisées.
  const plannedExpense: LocalAppState["expenses"][number] = {
    id: makeId("exp"),
    householdId,
    userId: u1,
    amountCents: 25000,
    currency: "EUR",
    paymentSource: "common_account",
    splitRule: { mode: "prorata" },
    date: `${month}-25`,
    budgetId: "budget_voiture",
    note: "Révision voiture",
    source: "manual",
    planned: true,
    createdAt: now,
    updatedAt: now,
  };

  // Historique fictif sur les mois précédents pour étoffer les fiches enseignes
  // (n'affecte pas le mois courant, filtré par mois dans le tableau de bord).
  function monthMinus(base: string, n: number): string {
    let m = base;
    for (let k = 0; k < n; k += 1) m = previousMonth(m);
    return m;
  }
  interface HistPoint {
    monthsAgo: number;
    day: number;
    cents: number;
    meal?: boolean;
  }
  function buildHistory(
    points: HistPoint[],
    merchantId: string,
    budgetId: string,
  ): LocalAppState["expenses"] {
    return points.map((p, i) => {
      const userId = i % 2 === 0 ? u1 : u2;
      return {
        id: makeId("exp"),
        householdId,
        merchantId,
        userId,
        amountCents: p.cents,
        currency: "EUR",
        paymentSource: p.meal ? "meal_voucher" : "common_account",
        mealVoucherUserId: p.meal ? userId : undefined,
        splitRule: { mode: "prorata" },
        date: `${monthMinus(month, p.monthsAgo)}-${String(p.day).padStart(2, "0")}`,
        budgetId,
        source: "manual",
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  const carrefourHistory: HistPoint[] = [
    { monthsAgo: 1, day: 3, cents: 14250 },
    { monthsAgo: 1, day: 11, cents: 8830, meal: true },
    { monthsAgo: 1, day: 19, cents: 16740 },
    { monthsAgo: 1, day: 27, cents: 11200 },
    { monthsAgo: 2, day: 2, cents: 15990 },
    { monthsAgo: 2, day: 9, cents: 9450 },
    { monthsAgo: 2, day: 17, cents: 13320, meal: true },
    { monthsAgo: 2, day: 25, cents: 17880 },
    { monthsAgo: 3, day: 5, cents: 12100 },
    { monthsAgo: 3, day: 13, cents: 16650 },
    { monthsAgo: 3, day: 21, cents: 8990 },
    { monthsAgo: 3, day: 28, cents: 14770 },
    { monthsAgo: 4, day: 4, cents: 13880 },
    { monthsAgo: 4, day: 12, cents: 15510, meal: true },
    { monthsAgo: 4, day: 20, cents: 9930 },
    { monthsAgo: 4, day: 26, cents: 18230 },
    { monthsAgo: 5, day: 6, cents: 11470 },
    { monthsAgo: 5, day: 15, cents: 17050 },
    { monthsAgo: 5, day: 23, cents: 13690 },
  ];
  const bistrotHistory: HistPoint[] = [
    { monthsAgo: 1, day: 10, cents: 6800 },
    { monthsAgo: 1, day: 24, cents: 4250, meal: true },
    { monthsAgo: 2, day: 15, cents: 7920 },
    { monthsAgo: 3, day: 8, cents: 5400 },
    { monthsAgo: 3, day: 22, cents: 9100 },
    { monthsAgo: 4, day: 18, cents: 6650 },
    { monthsAgo: 5, day: 12, cents: 8300 },
  ];

  // Mois précédent : mêmes budgets avec de légères variations (sauf courses /
  // restaurant déjà couverts par l'historique enseignes) → comparaison N vs N-1.
  const prevMirror: LocalAppState["expenses"] = realExpenses
    .filter((e) => e.budgetId !== "budget_courses" && e.budgetId !== "budget_restaurant")
    .map((e, i) => ({
      id: makeId("exp"),
      householdId,
      userId: i % 2 === 0 ? u1 : u2,
      amountCents: Math.round(e.amountCents * (0.85 + (i % 5) * 0.07)),
      currency: "EUR",
      paymentSource: "common_account",
      splitRule: { mode: "prorata" },
      date: `${prev}-${String((i % 26) + 2).padStart(2, "0")}`,
      budgetId: e.budgetId,
      source: "manual",
      createdAt: now,
      updatedAt: now,
    }));

  // Dépenses réelles sur des budgets annuels (pour la vue annuelle).
  const annualReals: LocalAppState["expenses"] = [
    {
      id: makeId("exp"),
      householdId,
      userId: u1,
      amountCents: 150000,
      currency: "EUR",
      paymentSource: "common_account",
      splitRule: { mode: "prorata" },
      date: `${monthMinus(month, 2)}-14`,
      budgetId: "budget_vacances",
      note: "Acompte location",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: makeId("exp"),
      householdId,
      userId: u2,
      amountCents: 80800,
      currency: "EUR",
      paymentSource: "common_account",
      splitRule: { mode: "prorata" },
      date: `${monthMinus(month, 3)}-18`,
      budgetId: "budget_cadastre",
      note: "Taxe foncière",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const expenses: LocalAppState["expenses"] = [
    ...currentExpenses,
    ...mealCurrent,
    plannedExpense,
    ...prevMirror,
    ...annualReals,
    ...buildHistory(carrefourHistory, "merchant_carrefour", "budget_courses"),
    ...buildHistory(bistrotHistory, "merchant_resto", "budget_restaurant"),
  ];

  const provisions = generateMonthlyAnnualBudgetProvisions({
    budgets,
    month,
    existingProvisions: [],
    activeUsers: users,
    incomes,
    now,
  });

  const recurringExpenses: LocalAppState["recurringExpenses"] = [
    {
      id: "rec_netflix",
      householdId,
      label: "Netflix",
      amountCents: 1349,
      budgetId: "budget_internet",
      userId: u1,
      paymentSource: "common_account",
      splitRule: { mode: "prorata" },
      dayOfMonth: 5,
      startMonth: month,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "rec_sport",
      householdId,
      label: "Salle de sport",
      amountCents: 2990,
      budgetId: "budget_galipettes",
      userId: u2,
      paymentSource: "common_account",
      splitRule: { mode: "prorata" },
      dayOfMonth: 2,
      startMonth: month,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Mois précédent déjà clôturé (pour illustrer l'archive du bilan).
  const prevProgress = budgetProgressForMonth(budgets, expenses, prev);
  const prevSettlement = computeSettlement({ expenses, activeUsers: users, incomes, month: prev });
  const monthClosures: LocalAppState["monthClosures"] = [
    {
      id: makeId("close"),
      householdId,
      month: prev,
      closedAt: now,
      budgetTotalCents: budgetTotalForMonth(budgets, prev),
      spentTotalCents: spentTotalForMonth(expenses, prev),
      byBudget: prevProgress.map((p) => ({
        budgetId: p.budgetId,
        plannedCents: p.plannedMonthlyCents,
        spentCents: p.spentCents,
      })),
      settlementTransfers: prevSettlement.transfers,
    },
  ];

  const year = month.slice(0, 4);
  const savingsGoals: LocalAppState["savingsGoals"] = [
    {
      id: "goal_vacances",
      householdId,
      name: "Vacances",
      icon: "plane",
      targetCents: 600000,
      currentCents: 240000,
      targetDate: `${year}-12-20`,
      budgetId: "budget_vacances",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "goal_etudes",
      householdId,
      name: "Études Léonie",
      icon: "backpack",
      targetCents: 1000000,
      currentCents: 320000,
      targetDate: `${Number(year) + 1}-09-01`,
      budgetId: "budget_epargne",
      createdAt: now,
      updatedAt: now,
    },
  ];

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
    recurringExpenses,
    materializedRecurring: [],
    savingsGoals,
    monthClosures,
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
    recurringExpenses: [],
    materializedRecurring: [],
    savingsGoals: [],
    monthClosures: [],
    passkeys: [],
    onboardingComplete: false,
    currentUserId: null,
  };
}
