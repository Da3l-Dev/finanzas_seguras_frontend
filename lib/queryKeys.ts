export type TransactionFilters = {
  from?: string;
  to?: string;
  type?: "EXPENSE" | "INCOME" | "TRANSFER" | "CREDIT_CARD_PAYMENT" | "ADJUSTMENT";
  categoryId?: string;
  accountId?: string;
  take?: number;
  skip?: number;
  search?: string;
};
export type CategoryType = "EXPENSE" | "INCOME";
export type StatsPeriod = "HOY" | "SEMANA" | "MES" | "AÑO";

// Todas las claves incluyen el usuario para separar las sesiones.
export const queryKeys = {
  accounts: (userId: string) => ["accounts", userId] as const,
  accountAnalytics: (userId: string) => ["accountAnalytics", userId] as const,
  transactions: (userId: string) => ["transactions", userId] as const,
  transactionList: (userId: string, filters: TransactionFilters) => ["transactions", userId, filters] as const,
  categories: (userId: string) => ["categories", userId] as const,
  categoryList: (userId: string, type: CategoryType) => ["categories", userId, type] as const,
  dashboard: (userId: string) => ["summary", userId] as const,
  stats: (userId: string, period: StatsPeriod) => ["stats", userId, period] as const,
  goals: (userId: string) => ["goals", userId] as const,
  budgets: (userId: string) => ["budgets", userId] as const,
  profile: (userId: string) => ["profile", userId] as const,
};
