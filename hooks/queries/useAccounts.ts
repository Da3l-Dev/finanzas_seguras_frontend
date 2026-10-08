import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import { queryFetch } from "@/lib/queryUtils";

export type AccountType = "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "SAVINGS" | "INVESTMENT";
export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  institution: string | null;
  lastFourDigits: string | null;
  openingBalance: number;
  currentBalance: number;
  creditLimit: number | null;
  creditAvailable: number | null;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  isActive: boolean;
  archivedAt?: string | null;
  includeInNetWorth: boolean;
  createdAt: string;
};
export type AccountMetric = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  currentBalance: number;
  creditLimit: number | null;
  creditUsedPct: number | null;
  spent6m: number;
  income6m: number;
  txCount6m: number;
  avgTx: number;
  monthlyAvg: number;
  lastUsedAt: string | null;
  monthSpent: number;
  monthIncome: number;
  monthCount: number;
};
export type AccountAnalytics = {
  totalBalance: number;
  accounts: AccountMetric[];
  monthlySpending: Array<{ year: number; month: number; label: string; spent: number; income: number; count: number }>;
  totals: { monthSpent: number; monthIncome: number; monthCount: number; avgPerTx: number };
  topSpendingAccountId: string | null;
};

export function useAccounts() {
  const { user, token, isLoading } = useAuth();
  return useQuery<Account[]>({
    queryKey: queryKeys.accounts(user?.id ?? ""),
    queryFn: () => queryFetch<Account[]>("/api/account", token!),
    enabled: !isLoading && !!user && !!token,
  });
}
export function useAccountAnalytics() {
  const { user, token, isLoading } = useAuth();
  return useQuery<AccountAnalytics>({
    queryKey: queryKeys.accountAnalytics(user?.id ?? ""),
    queryFn: () => queryFetch<AccountAnalytics>("/api/account/analytics", token!),
    enabled: !isLoading && !!user && !!token,
  });
}

// Incluye cuentas archivadas para permitir restaurarlas o eliminarlas de PostgreSQL.
export function useAllAccounts() {
  const { user, token, isLoading } = useAuth();
  return useQuery<Account[]>({
    queryKey: [...queryKeys.accounts(user?.id ?? ""), "archived"],
    queryFn: () => queryFetch<Account[]>("/api/account?includeArchived=true", token!),
    enabled: !isLoading && !!user && !!token,
  });
}
