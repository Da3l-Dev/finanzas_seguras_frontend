import { useCallback, useState } from "react";

export type EditingTransaction = {
  id: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  categoryId: string | null;
  sourceAccountId: string | null;
  description: string | null;
  occurredAt: string;
};

export function useTransactionForm() {
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<EditingTransaction | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setVisible(true);
  }, []);

  const openEdit = useCallback((tx: EditingTransaction) => {
    setEditing(tx);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    // Pequeño delay para que la animación de cierre termine antes de limpiar
    setTimeout(() => setEditing(null), 300);
  }, []);

  return {
    visible,
    editing,
    openCreate,
    openEdit,
    close,
  };
}
