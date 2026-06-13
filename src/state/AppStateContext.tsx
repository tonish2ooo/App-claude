"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  type Budget,
  type Expense,
  type Household,
  type LocalAppState,
  type Merchant,
  type Month,
  type MonthlyIncome,
  type ProvisionStatus,
  type UserProfile,
} from "@/lib/types";
import { loadState, saveState } from "@/lib/storage/localState";
import { buildDemoState, buildEmptyState } from "@/lib/seed/demo";
import { generateMonthlyAnnualBudgetProvisions } from "@/lib/calc/provisions";
import { makeId } from "@/lib/id";
import { todayIso } from "@/lib/date";

interface AppStateApi {
  state: LocalAppState;
  ready: boolean;
  currentUser: UserProfile | null;
  activeUsers: UserProfile[];
  currentMonth: Month;

  loadDemo: () => void;
  resetEmpty: () => void;

  updateHousehold: (patch: Partial<Household>) => void;
  setCurrentMonth: (month: Month) => void;
  setCurrentUser: (userId: string | null) => void;
  completeOnboarding: () => void;

  addUser: (user: Omit<UserProfile, "id" | "householdId" | "createdAt" | "updatedAt">) => UserProfile;
  updateUser: (id: string, patch: Partial<UserProfile>) => void;
  removeUser: (id: string) => void;

  upsertIncome: (income: {
    id?: string;
    userId: string;
    month: Month;
    salaryCents: number;
    mealVouchersCents: number;
    notes?: string;
  }) => void;
  removeIncome: (id: string) => void;
  duplicatePreviousMonthIncomes: (month: Month) => void;

  addBudget: (budget: Omit<Budget, "id" | "householdId" | "createdAt" | "updatedAt">) => Budget;
  updateBudget: (id: string, patch: Partial<Budget>) => void;
  removeBudget: (id: string) => void;
  toggleBudget: (id: string) => void;

  addMerchant: (merchant: Omit<Merchant, "id" | "householdId" | "createdAt" | "updatedAt">) => Merchant;
  updateMerchant: (id: string, patch: Partial<Merchant>) => void;
  removeMerchant: (id: string) => void;

  addExpense: (expense: Omit<Expense, "id" | "householdId" | "createdAt" | "updatedAt">) => Expense;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  removeExpense: (id: string) => void;

  setProvisionStatus: (id: string, status: ProvisionStatus) => void;
}

const AppStateContext = createContext<AppStateApi | null>(null);

/** Régénère les provisions du mois courant (idempotent). */
function withRegeneratedProvisions(state: LocalAppState): LocalAppState {
  const activeUsers = state.users.filter((u) => u.active);
  const provisions = generateMonthlyAnnualBudgetProvisions({
    budgets: state.budgets,
    month: state.household.currentMonth,
    existingProvisions: state.provisions,
    activeUsers,
    incomes: state.incomes,
  });
  return { ...state, provisions };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocalAppState>(() => buildEmptyState());
  const [ready, setReady] = useState(false);

  // Hydratation depuis localStorage (ou état vide) au montage.
  useEffect(() => {
    const loaded = loadState();
    setState(withRegeneratedProvisions(loaded ?? buildEmptyState()));
    setReady(true);
  }, []);

  // Persistance à chaque changement (une fois hydraté).
  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const now = () => new Date().toISOString();

  function update(updater: (prev: LocalAppState) => LocalAppState) {
    setState((prev) => withRegeneratedProvisions(updater(prev)));
  }

  const api = useMemo<AppStateApi>(() => {
    const currentUser = state.users.find((u) => u.id === state.currentUserId) ?? null;
    const activeUsers = state.users.filter((u) => u.active);

    return {
      state,
      ready,
      currentUser,
      activeUsers,
      currentMonth: state.household.currentMonth,

      loadDemo: () => setState(withRegeneratedProvisions(buildDemoState())),
      resetEmpty: () => setState(withRegeneratedProvisions(buildEmptyState())),

      updateHousehold: (patch) =>
        update((prev) => ({
          ...prev,
          household: { ...prev.household, ...patch, updatedAt: now() },
        })),

      setCurrentMonth: (month) =>
        update((prev) => ({
          ...prev,
          household: { ...prev.household, currentMonth: month, updatedAt: now() },
        })),

      setCurrentUser: (userId) => update((prev) => ({ ...prev, currentUserId: userId })),

      completeOnboarding: () => update((prev) => ({ ...prev, onboardingComplete: true })),

      addUser: (user) => {
        const created: UserProfile = {
          ...user,
          id: makeId("user"),
          householdId: state.household.id,
          createdAt: now(),
          updatedAt: now(),
        };
        update((prev) => ({
          ...prev,
          users: [...prev.users, created],
          currentUserId: prev.currentUserId ?? created.id,
        }));
        return created;
      },
      updateUser: (id, patch) =>
        update((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === id ? { ...u, ...patch, updatedAt: now() } : u,
          ),
        })),
      removeUser: (id) =>
        update((prev) => ({
          ...prev,
          users: prev.users.filter((u) => u.id !== id),
          currentUserId: prev.currentUserId === id ? null : prev.currentUserId,
        })),

      upsertIncome: (income) =>
        update((prev) => {
          const existing = prev.incomes.find(
            (i) =>
              (income.id && i.id === income.id) ||
              (i.userId === income.userId && i.month === income.month),
          );
          if (existing) {
            return {
              ...prev,
              incomes: prev.incomes.map((i) =>
                i.id === existing.id
                  ? {
                      ...i,
                      salaryCents: income.salaryCents,
                      mealVouchersCents: income.mealVouchersCents,
                      notes: income.notes,
                      lastEditedByUserId: prev.currentUserId ?? undefined,
                      updatedAt: now(),
                    }
                  : i,
              ),
            };
          }
          const created: MonthlyIncome = {
            id: makeId("inc"),
            householdId: prev.household.id,
            userId: income.userId,
            month: income.month,
            salaryCents: income.salaryCents,
            mealVouchersCents: income.mealVouchersCents,
            notes: income.notes,
            declaredAt: todayIso(),
            lastEditedByUserId: prev.currentUserId ?? undefined,
            createdAt: now(),
            updatedAt: now(),
          };
          return { ...prev, incomes: [...prev.incomes, created] };
        }),
      removeIncome: (id) =>
        update((prev) => ({ ...prev, incomes: prev.incomes.filter((i) => i.id !== id) })),
      duplicatePreviousMonthIncomes: (month) =>
        update((prev) => {
          const [yStr, mStr] = month.split("-");
          const y = Number(yStr);
          const m = Number(mStr);
          const prevMonth = m <= 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
          const source = prev.incomes.filter((i) => i.month === prevMonth);
          const additions: MonthlyIncome[] = [];
          for (const src of source) {
            const already = prev.incomes.find(
              (i) => i.userId === src.userId && i.month === month,
            );
            if (already) continue;
            additions.push({
              ...src,
              id: makeId("inc"),
              month,
              declaredAt: todayIso(),
              lastEditedByUserId: prev.currentUserId ?? undefined,
              createdAt: now(),
              updatedAt: now(),
            });
          }
          return { ...prev, incomes: [...prev.incomes, ...additions] };
        }),

      addBudget: (budget) => {
        const created: Budget = {
          ...budget,
          id: makeId("budget"),
          householdId: state.household.id,
          createdAt: now(),
          updatedAt: now(),
        };
        update((prev) => ({ ...prev, budgets: [...prev.budgets, created] }));
        return created;
      },
      updateBudget: (id, patch) =>
        update((prev) => ({
          ...prev,
          budgets: prev.budgets.map((b) =>
            b.id === id ? { ...b, ...patch, updatedAt: now() } : b,
          ),
        })),
      removeBudget: (id) =>
        update((prev) => ({
          ...prev,
          budgets: prev.budgets.filter((b) => b.id !== id),
          provisions: prev.provisions.filter((p) => p.budgetId !== id),
        })),
      toggleBudget: (id) =>
        update((prev) => ({
          ...prev,
          budgets: prev.budgets.map((b) =>
            b.id === id ? { ...b, active: !b.active, updatedAt: now() } : b,
          ),
        })),

      addMerchant: (merchant) => {
        const created: Merchant = {
          ...merchant,
          id: makeId("merchant"),
          householdId: state.household.id,
          createdAt: now(),
          updatedAt: now(),
        };
        update((prev) => ({ ...prev, merchants: [...prev.merchants, created] }));
        return created;
      },
      updateMerchant: (id, patch) =>
        update((prev) => ({
          ...prev,
          merchants: prev.merchants.map((m) =>
            m.id === id ? { ...m, ...patch, updatedAt: now() } : m,
          ),
        })),
      removeMerchant: (id) =>
        update((prev) => ({ ...prev, merchants: prev.merchants.filter((m) => m.id !== id) })),

      addExpense: (expense) => {
        const created: Expense = {
          ...expense,
          id: makeId("exp"),
          householdId: state.household.id,
          createdAt: now(),
          updatedAt: now(),
        };
        update((prev) => ({ ...prev, expenses: [...prev.expenses, created] }));
        return created;
      },
      updateExpense: (id, patch) =>
        update((prev) => ({
          ...prev,
          expenses: prev.expenses.map((e) =>
            e.id === id ? { ...e, ...patch, updatedAt: now() } : e,
          ),
        })),
      removeExpense: (id) =>
        update((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) })),

      setProvisionStatus: (id, status) =>
        update((prev) => ({
          ...prev,
          provisions: prev.provisions.map((p) =>
            p.id === id ? { ...p, status, updatedAt: now() } : p,
          ),
        })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready]);

  return <AppStateContext.Provider value={api}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateApi {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState doit être utilisé dans AppStateProvider");
  return ctx;
}
