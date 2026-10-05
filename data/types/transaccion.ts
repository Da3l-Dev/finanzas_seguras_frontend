import type { SymbolView } from "expo-symbols";
import type { ComponentProps } from "react";

export type Categoria =
  | "Nómina"
  | "Freelance"
  | "Reembolso"
  | "Alimentación"
  | "Transporte"
  | "Compras"
  | "Suscripciones"
  | "Servicios"
  | "Salud"
  | "Entretenimiento"
  | "Otros";

export type Transaccion = {
  id: string;
  icon: ComponentProps<typeof SymbolView>["name"];
  name: string;
  type: "Ingreso" | "Gasto";
  category: Categoria;
  amount: number;
  date: string;
};
