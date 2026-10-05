import type { SymbolViewProps } from "expo-symbols";

export type SymbolName = SymbolViewProps["name"];

export type CuentaTipo =
  | "CASH"
  | "DEBIT_CARD"
  | "CREDIT_CARD"
  | "SAVINGS"
  | "INVESTMENT";

export type Cuenta = {
  id: string;
  name: string;
  type: CuentaTipo;
  icon: SymbolName; // ✅ aquí está el fix
};

export const cuentas: Cuenta[] = [
  {
    id: "a1",
    name: "Efectivo",
    type: "CASH",
    icon: { android: "payments", web: "payments" },
  },
  {
    id: "a2",
    name: "Débito BBVA",
    type: "DEBIT_CARD",
    icon: { android: "credit_card", web: "credit_card" },
  },
  {
    id: "a3",
    name: "Crédito Nu",
    type: "CREDIT_CARD",
    icon: { android: "credit_card", web: "credit_card" },
  },
  {
    id: "a4",
    name: "Ahorro",
    type: "SAVINGS",
    icon: { android: "savings", web: "savings" },
  },
];
