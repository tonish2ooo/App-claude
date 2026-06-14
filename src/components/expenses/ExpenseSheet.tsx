"use client";

import { useState } from "react";
import { useAppState } from "@/state/AppStateContext";
import { Sheet } from "@/components/ui/Sheet";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { ExpenseDetail } from "@/components/expenses/ExpenseDetail";

/**
 * Panneau d'une dépense : affiche d'abord la fiche détail (lecture seule),
 * puis bascule en édition sur « Modifier ».
 */
export function ExpenseSheet({
  expenseId,
  onClose,
}: {
  expenseId: string | null;
  onClose: () => void;
}) {
  const { state } = useAppState();
  const [editing, setEditing] = useState(false);
  const expense = state.expenses.find((e) => e.id === expenseId);

  function close() {
    setEditing(false);
    onClose();
  }

  return (
    <Sheet
      open={expenseId !== null}
      onClose={close}
      title={editing ? "Modifier la dépense" : "Détail de la dépense"}
    >
      {expense &&
        (editing ? (
          <ExpenseForm expense={expense} onDone={close} />
        ) : (
          <ExpenseDetail expense={expense} onEdit={() => setEditing(true)} onDelete={close} />
        ))}
    </Sheet>
  );
}
