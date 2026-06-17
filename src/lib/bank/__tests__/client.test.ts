import { describe, expect, it } from "vitest";
import { toPendingTransactions } from "../client";
import type { PendingBankTransaction } from "@/lib/types";

describe("toPendingTransactions", () => {
  const raw = [
    { id: "tx1", date: "2026-06-10", amountCents: -4290, label: "Delhaize" },
    { id: "tx2", date: "2026-06-11", amountCents: 245000, label: "Salaire" },
  ];

  it("convertit les transactions brutes en transactions à rapprocher", () => {
    const result = toPendingTransactions("acc1", raw, []);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "tx1", accountId: "acc1", status: "pending" });
  });

  it("ignore les transactions déjà connues (déduplication par id)", () => {
    const existing: PendingBankTransaction[] = [
      { id: "tx1", accountId: "acc1", date: "2026-06-10", amountCents: -4290, label: "Delhaize", status: "imported" },
    ];
    const result = toPendingTransactions("acc1", raw, existing);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("tx2");
  });
});
