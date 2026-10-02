import type { SymbolName } from "./symbols";

export type CategoriaTipo = "EXPENSE" | "INCOME";

export type Categoria = {
  id: string;
  name: string;
  icon: SymbolName;
  type: CategoriaTipo;
};

export const categorias: Categoria[] = [
  {
    id: "c1",
    name: "Comida",
    icon: { android: "restaurant", web: "restaurant" },
    type: "EXPENSE",
  },
  {
    id: "c2",
    name: "Gasolina",
    icon: { android: "local_gas_station", web: "local_gas_station" },
    type: "EXPENSE",
  },
  {
    id: "c3",
    name: "Súper",
    icon: { android: "shopping_cart", web: "shopping_cart" },
    type: "EXPENSE",
  },
  {
    id: "c4",
    name: "Casa",
    icon: { android: "home", web: "home" },
    type: "EXPENSE",
  },
  {
    id: "c5",
    name: "Transporte",
    icon: { android: "directions_car", web: "directions_car" },
    type: "EXPENSE",
  },
  {
    id: "c6",
    name: "Ocio",
    icon: { android: "movie", web: "movie" },
    type: "EXPENSE",
  },
  {
    id: "c7",
    name: "Salud",
    icon: { android: "medical_services", web: "medical_services" },
    type: "EXPENSE",
  },

  {
    id: "i1",
    name: "Nómina",
    icon: { android: "work", web: "work" },
    type: "INCOME",
  },
  {
    id: "i2",
    name: "Freelance",
    icon: { android: "laptop_mac", web: "laptop_mac" },
    type: "INCOME",
  },
  {
    id: "i3",
    name: "Reembolso",
    icon: { android: "replay", web: "replay" },
    type: "INCOME",
  },
  {
    id: "i4",
    name: "Regalo",
    icon: { android: "card_giftcard", web: "card_giftcard" },
    type: "INCOME",
  },
];
