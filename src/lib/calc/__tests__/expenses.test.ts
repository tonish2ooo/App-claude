import { describe, expect, it } from "vitest";
import {
  mealVouchersSpentByUser,
  spentForBudget,
  spentFromCommonAccount,
} from "../expenses";
import { mealVoucherBalances } from "../dashboard";
import { makeExpense, makeIncome, makeUser } from "./fixtures";

const MONTH = "2026-06";
const u1 = makeUser("u1");
const u2 = makeUser("u2");

describe("dépenses depuis le compte commun", () => {
  it("réduisent le solde commun estimé", () => {
    const expenses = [
      makeExpense("a", { paymentSource: "common_account", amountCents: 5000 }),
      makeExpense("b", { paymentSource: "common_account", amountCents: 2500 }),
      makeExpense("c", { paymentSource: "meal_voucher", amountCents: 1000, mealVoucherUserId: "u1" }),
    ];
    expect(spentFromCommonAccount(expenses, MONTH)).toBe(7500);
  });
});

describe("dépenses en tickets restaurant", () => {
  it("réduisent le solde TR de l'utilisateur concerné", () => {
    const incomes = [makeIncome("u1", MONTH, 0, 15000), makeIncome("u2", MONTH, 0, 10000)];
    const expenses = [
      makeExpense("a", { paymentSource: "meal_voucher", mealVoucherUserId: "u1", amountCents: 4000 }),
      makeExpense("b", { paymentSource: "meal_voucher", mealVoucherUserId: "u2", amountCents: 1500 }),
    ];
    expect(mealVouchersSpentByUser(expenses, "u1", MONTH)).toBe(4000);

    const balances = mealVoucherBalances([u1, u2], incomes, expenses, MONTH);
    expect(balances.find((b) => b.userId === "u1")?.remainingCents).toBe(11000);
    expect(balances.find((b) => b.userId === "u2")?.remainingCents).toBe(8500);
  });

  it("une dépense TR n'impacte pas le solde commun", () => {
    const expenses = [
      makeExpense("a", { paymentSource: "meal_voucher", mealVoucherUserId: "u1", amountCents: 4000 }),
    ];
    expect(spentFromCommonAccount(expenses, MONTH)).toBe(0);
  });
});

describe("association budget", () => {
  it("une dépense met à jour le réel dépensé du budget", () => {
    const expenses = [
      makeExpense("a", { budgetId: "courses", amountCents: 3000 }),
      makeExpense("b", { budgetId: "courses", amountCents: 2000 }),
      makeExpense("c", { budgetId: "loyer", amountCents: 100000 }),
    ];
    expect(spentForBudget(expenses, "courses", MONTH)).toBe(5000);
    expect(spentForBudget(expenses, "loyer", MONTH)).toBe(100000);
  });

  it("ignore les dépenses d'un autre mois", () => {
    const expenses = [
      makeExpense("a", { budgetId: "courses", amountCents: 3000, date: "2026-05-20" }),
      makeExpense("b", { budgetId: "courses", amountCents: 2000, date: "2026-06-02" }),
    ];
    expect(spentForBudget(expenses, "courses", MONTH)).toBe(2000);
  });
});
