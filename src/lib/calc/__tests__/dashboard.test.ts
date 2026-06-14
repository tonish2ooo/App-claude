import { describe, expect, it } from "vitest";
import {
  budgetProgressForMonth,
  budgetTotalForMonth,
  buildDashboardSummary,
  contributionSummaries,
  mealVoucherBalances,
} from "../dashboard";
import { spentForBudget } from "../expenses";
import { computeMerchantStats } from "../merchants";
import {
  makeBudget,
  makeExpense,
  makeHousehold,
  makeIncome,
  makeUser,
} from "./fixtures";

const MONTH = "2026-06";
const u1 = makeUser("u1");
const u2 = makeUser("u2");
const incomes = [
  makeIncome("u1", MONTH, 300000, 10000), // 3000 € + 100 € TR
  makeIncome("u2", MONTH, 100000, 20000), // 1000 € + 200 € TR
];

describe("budget total du mois", () => {
  it("inclut mensuels + provisions annuelles + épargne", () => {
    const budgets = [
      makeBudget("courses", "monthly", 50000),
      makeBudget("assurance", "annual", 120000), // -> 10000/mois
      makeBudget("epargne", "savings", 20000),
    ];
    expect(budgetTotalForMonth(budgets, MONTH)).toBe(80000);
  });
});

describe("progression budget", () => {
  it("réel dépensé et pourcentage d'atteinte", () => {
    const budgets = [makeBudget("courses", "monthly", 50000)];
    const expenses = [
      makeExpense("e1", { budgetId: "courses", amountCents: 30000 }),
      makeExpense("e2", { budgetId: "courses", amountCents: 10000 }),
    ];
    expect(spentForBudget(expenses, "courses", MONTH)).toBe(40000);
    const progress = budgetProgressForMonth(budgets, expenses, MONTH);
    expect(progress[0]?.spentCents).toBe(40000);
    expect(progress[0]?.progress).toBeCloseTo(0.8, 5);
    expect(progress[0]?.status).toBe("warning");
  });

  it("dépassement au-delà de 100 %", () => {
    const budgets = [makeBudget("courses", "monthly", 10000)];
    const expenses = [makeExpense("e1", { budgetId: "courses", amountCents: 12000 })];
    const progress = budgetProgressForMonth(budgets, expenses, MONTH);
    expect(progress[0]?.status).toBe("over");
  });
});

describe("provision annuelle vs vraie dépense", () => {
  it("la provision compte dans le budget total, la vraie dépense dans le réel sans double comptage", () => {
    const budgets = [makeBudget("assurance", "annual", 120000)];
    // Vraie dépense annuelle de 1200 € rattachée au budget annuel.
    const expenses = [makeExpense("real", { budgetId: "assurance", amountCents: 120000 })];

    // Budget total du mois = provision mensuelle = 10000.
    expect(budgetTotalForMonth(budgets, MONTH)).toBe(10000);
    // Réel dépensé sur le budget = 120000 (la vraie dépense), pas la provision.
    expect(spentForBudget(expenses, "assurance", MONTH)).toBe(120000);
  });
});

describe("contributions et reste personnel", () => {
  const budgets = [makeBudget("courses", "monthly", 40000)];

  it("contribution totale et reste personnel", () => {
    const summaries = contributionSummaries(budgets, [u1, u2], incomes, [], MONTH);
    const s1 = summaries.find((s) => s.userId === "u1");
    const s2 = summaries.find((s) => s.userId === "u2");
    // Apport : u1 = 310000, u2 = 120000, total = 430000.
    // Contribution prorata sur 40000.
    expect((s1?.contributionTotalCents ?? 0) + (s2?.contributionTotalCents ?? 0)).toBe(40000);
    expect(s1?.remainingTotalCents).toBe(310000 - (s1?.contributionTotalCents ?? 0));
  });

  it("tickets restaurant restants", () => {
    const expenses = [
      makeExpense("tr", {
        paymentSource: "meal_voucher",
        mealVoucherUserId: "u1",
        amountCents: 3000,
        budgetId: "courses",
      }),
    ];
    const balances = mealVoucherBalances([u1, u2], incomes, expenses, MONTH);
    expect(balances.find((b) => b.userId === "u1")?.remainingCents).toBe(10000 - 3000);
    expect(balances.find((b) => b.userId === "u2")?.remainingCents).toBe(20000);
  });
});

describe("résumé dashboard complet", () => {
  it("solde commun = contributions du mois − dépenses compte commun", () => {
    const household = makeHousehold();
    const budgets = [makeBudget("courses", "monthly", 40000)];
    const expenses = [
      makeExpense("e1", { budgetId: "courses", amountCents: 30000, paymentSource: "common_account" }),
    ];
    const summary = buildDashboardSummary({
      household,
      users: [u1, u2],
      budgets,
      incomes,
      expenses,
      month: MONTH,
    });
    // Contributions totales sur 40000 (prorata, sans perte) − 30000 dépensés.
    expect(summary.commonBalanceCents).toBe(40000 - 30000);
    expect(summary.commonBalanceStatus).toBe("estimated");
    expect(summary.spentTotalCents).toBe(30000);
    expect(summary.remainingBudgetCents).toBe(40000 - 30000);
    expect(summary.incomeComplete).toBe(true);
  });

  it("signale les revenus manquants", () => {
    const household = makeHousehold();
    const summary = buildDashboardSummary({
      household,
      users: [u1, u2],
      budgets: [],
      incomes: [makeIncome("u1", MONTH, 300000, 0)],
      expenses: [],
      month: MONTH,
    });
    expect(summary.missingIncomeUserIds).toEqual(["u2"]);
    expect(summary.incomeComplete).toBe(false);
  });
});

describe("statistiques enseignes", () => {
  it("dernière somme, moyenne et nombre de dépenses", () => {
    const expenses = [
      makeExpense("a", { merchantId: "m1", amountCents: 1000, date: "2026-06-01" }),
      makeExpense("b", { merchantId: "m1", amountCents: 3000, date: "2026-06-05" }),
      makeExpense("c", { merchantId: "m2", amountCents: 9999, date: "2026-06-02" }),
    ];
    const stats = computeMerchantStats("m1", expenses);
    expect(stats.expenseCount).toBe(2);
    expect(stats.lastAmountCents).toBe(3000);
    expect(stats.averageAmountCents).toBe(2000);
    expect(stats.totalAmountCents).toBe(4000);
  });

  it("enseigne sans dépense", () => {
    const stats = computeMerchantStats("x", []);
    expect(stats.expenseCount).toBe(0);
    expect(stats.lastAmountCents).toBeNull();
    expect(stats.averageAmountCents).toBeNull();
  });
});
