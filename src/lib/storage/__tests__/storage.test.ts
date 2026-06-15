import { afterEach, describe, expect, it, vi } from "vitest";
import { migrateState } from "../migrations";
import { clearState, loadState, saveState } from "../localState";
import { buildDemoState } from "../../seed/demo";
import { generateMonthlyAnnualBudgetProvisions } from "../../calc/provisions";
import { APP_STATE_VERSION } from "../../types";

function installFakeStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  vi.stubGlobal("window", { localStorage });
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("migrateState", () => {
  it("renvoie null pour une entrée invalide", () => {
    expect(migrateState(null)).toBeNull();
    expect(migrateState("oops")).toBeNull();
    expect(migrateState({ version: 1 })).toBeNull(); // pas de household
  });

  it("migre un ancien état v2 vers v3 en ajoutant les collections", () => {
    const old = {
      version: 2,
      household: {
        id: "h",
        name: "Foyer",
        currentMonth: "2026-06",
        defaultCurrency: "EUR",
        mode: "manual",
        createdAt: "x",
        updatedAt: "x",
      },
      users: [],
      budgets: [],
      expenses: [],
    };
    const migrated = migrateState(old);
    expect(migrated?.version).toBe(APP_STATE_VERSION);
    expect(migrated?.incomes).toEqual([]);
    expect(migrated?.provisions).toEqual([]);
    expect(migrated?.merchants).toEqual([]);
    expect(migrated?.passkeys).toEqual([]);
    // Collections introduites en v4.
    expect(migrated?.recurringExpenses).toEqual([]);
    expect(migrated?.materializedRecurring).toEqual([]);
    expect(migrated?.savingsGoals).toEqual([]);
  });
});

describe("localStorage round-trip", () => {
  it("sauvegarde et recharge l'état", () => {
    installFakeStorage();
    const state = buildDemoState();
    saveState(state);
    const loaded = loadState();
    expect(loaded?.household.id).toBe(state.household.id);
    expect(loaded?.users).toHaveLength(state.users.length);
    clearState();
    expect(loadState()).toBeNull();
  });

  it("ne crée pas de doublon de provisions après rechargement", () => {
    installFakeStorage();
    const state = buildDemoState();
    const month = state.household.currentMonth;
    const annualCount = state.budgets.filter((b) => b.active && b.type === "annual").length;

    saveState(state);
    const reloaded = loadState();
    expect(reloaded).not.toBeNull();

    // Relance de la génération après rechargement : aucun doublon.
    const regenerated = generateMonthlyAnnualBudgetProvisions({
      budgets: reloaded!.budgets,
      month,
      existingProvisions: reloaded!.provisions,
      activeUsers: reloaded!.users.filter((u) => u.active),
      incomes: reloaded!.incomes,
    });
    const forMonth = regenerated.filter(
      (p) => p.month === month && p.source === "automatic",
    );
    expect(forMonth).toHaveLength(annualCount);
  });
});
