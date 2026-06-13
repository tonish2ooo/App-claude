import type {
  Budget,
  BudgetSplitRule,
  Expense,
  Household,
  MonthlyIncome,
  UserProfile,
} from "../../types";

export const HID = "house_1";
const TS = "2026-06-01T00:00:00.000Z";

export function makeUser(id: string, overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id,
    householdId: HID,
    firstName: id,
    lastName: "Test",
    email: `${id}@test.fr`,
    role: "member",
    active: true,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeIncome(
  userId: string,
  month: string,
  salaryCents: number,
  mealVouchersCents: number,
): MonthlyIncome {
  return {
    id: `inc_${userId}_${month}`,
    householdId: HID,
    userId,
    month,
    salaryCents,
    mealVouchersCents,
    declaredAt: `${month}-05`,
    createdAt: TS,
    updatedAt: TS,
  };
}

export function makeBudget(
  id: string,
  type: Budget["type"],
  amountCents: number,
  splitRule: BudgetSplitRule = { mode: "prorata" },
  overrides: Partial<Budget> = {},
): Budget {
  return {
    id,
    householdId: HID,
    name: id,
    amountCents,
    type,
    icon: "📦",
    active: true,
    order: 0,
    splitRule,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeExpense(
  id: string,
  overrides: Partial<Expense> = {},
): Expense {
  return {
    id,
    householdId: HID,
    userId: "u1",
    amountCents: 1000,
    currency: "EUR",
    paymentSource: "common_account",
    splitRule: { mode: "prorata" },
    date: "2026-06-10",
    source: "manual",
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

export function makeHousehold(overrides: Partial<Household> = {}): Household {
  return {
    id: HID,
    name: "Foyer Test",
    currentMonth: "2026-06",
    defaultCurrency: "EUR",
    mode: "manual",
    manualCommonBalanceCents: 200000,
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}
