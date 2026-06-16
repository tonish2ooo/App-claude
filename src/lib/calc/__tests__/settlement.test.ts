import { describe, expect, it } from "vitest";
import { computeSettlement } from "../settlement";
import { makeExpense, makeIncome, makeUser } from "./fixtures";

const MONTH = "2026-06";
const u1 = makeUser("u1");
const u2 = makeUser("u2");
// Revenus égaux → répartition prorata 50/50.
const incomes = [makeIncome("u1", MONTH, 200000, 0), makeIncome("u2", MONTH, 200000, 0)];

describe("computeSettlement", () => {
  it("équilibre quand chacun a payé sa part", () => {
    const expenses = [
      makeExpense("a", { userId: "u1", amountCents: 10000, paymentSource: "common_account", date: "2026-06-02" }),
      makeExpense("b", { userId: "u2", amountCents: 10000, paymentSource: "common_account", date: "2026-06-05" }),
    ];
    const s = computeSettlement({ expenses, activeUsers: [u1, u2], incomes, month: MONTH });
    expect(s.totalCommonCents).toBe(20000);
    expect(s.transfers).toHaveLength(0);
  });

  it("calcule le virement quand l'un a tout payé", () => {
    const expenses = [
      makeExpense("a", { userId: "u1", amountCents: 20000, paymentSource: "common_account", date: "2026-06-02" }),
    ];
    const s = computeSettlement({ expenses, activeUsers: [u1, u2], incomes, month: MONTH });
    // u1 a payé 20000, part = 10000 → net +10000 ; u2 doit 10000.
    expect(s.transfers).toEqual([{ fromUserId: "u2", toUserId: "u1", amountCents: 10000 }]);
  });

  it("ignore les tickets resto et les dépenses planifiées", () => {
    const expenses = [
      makeExpense("a", { userId: "u1", amountCents: 20000, paymentSource: "common_account", date: "2026-06-02" }),
      makeExpense("tr", { userId: "u1", amountCents: 5000, paymentSource: "meal_voucher", date: "2026-06-03" }),
      makeExpense("p", { userId: "u1", amountCents: 9000, paymentSource: "common_account", date: "2026-06-25", planned: true }),
    ];
    const s = computeSettlement({ expenses, activeUsers: [u1, u2], incomes, month: MONTH });
    expect(s.totalCommonCents).toBe(20000);
    expect(s.transfers).toEqual([{ fromUserId: "u2", toUserId: "u1", amountCents: 10000 }]);
  });
});
