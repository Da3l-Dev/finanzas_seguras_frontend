import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { queryKeys, type TransactionFilters } from "@/lib/queryKeys";
import { buildQueryString, queryFetch } from "@/lib/queryUtils";

export type TransactionType = "EXPENSE" | "INCOME" | "TRANSFER" | "CREDIT_CARD_PAYMENT" | "ADJUSTMENT";
export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  occurredAt: string;
  description: string | null;
  notes: string | null;
  categoryId: string | null;
  sourceAccountId: string | null;
  targetAccountId: string | null;
  category: { id: string; name: string; color: string | null; icon: string | null } | null;
  merchant: { id: string; name: string } | null;
  sourceAccount: { id: string; name: string } | null;
  targetAccount: { id: string; name: string } | null;
};
export type TransactionsPage = { items: Transaction[]; total: number; take: number; skip: number };

export function useTransactions(filters: TransactionFilters = {}) {
  const { user, token, isLoading } = useAuth();
  const normalizedFilters: TransactionFilters = { ...filters, take: filters.take ?? 50, skip: filters.skip ?? 0 };
  const queryString = buildQueryString(normalizedFilters);
  return useQuery<TransactionsPage>({
    queryKey: queryKeys.transactionList(user?.id ?? "", normalizedFilters),
    queryFn: () => queryFetch<TransactionsPage>(`/api/transactions${queryString}`, token!),
    enabled: !isLoading && !!user && !!token,
    placeholderData: keepPreviousData,
  });
}
