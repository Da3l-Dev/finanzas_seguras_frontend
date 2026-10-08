import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import type { CategoryType } from "@/lib/queryKeys";

export type FinanceResponse<T> = { success?: boolean; status?: "ok" | "error"; message?: string; data?: T; errors?: unknown };
export async function sendFinance<T>(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", token: string, payload?: unknown): Promise<T> {
  const response = await apiFetch<FinanceResponse<T>>(path, {
    method,
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  }, token);
  if (!response || response.success === false || response.status === "error") {
    throw new ApiError(400, response?.message ?? "No se pudo completar la operación.", response);
  }
  return response.data as T;
}

function useFinanceMutation<TInput, TResult>(endpoint: (payload: TInput) => string, method: "POST" | "PUT" | "PATCH" | "DELETE", getBody: (payload: TInput) => unknown, affected: string[]) {
  const { token, user } = useAuth();
  const client = useQueryClient();
  return useMutation<TResult, Error, TInput>({
    mutationFn: payload => {
      if (!token) throw new Error("Inicia sesión para continuar.");
      return sendFinance<TResult>(endpoint(payload), method, token, getBody(payload));
    },
    onSuccess: async () => {
      if (!user) return;
      // Actualiza todas las consultas asociadas, incluso con otros filtros.
      await Promise.all(affected.map(prefix => client.invalidateQueries({ queryKey: [prefix, user.id] })));
    },
  });
}
const finance = ["transactions", "accounts", "summary", "stats", "accountAnalytics", "budgets", "goals"];
const accounts = ["accounts", "summary", "stats", "accountAnalytics"];
export type TransactionInput = {
  type: "EXPENSE" | "INCOME";
  amount: number;
  sourceAccountId: string;
  categoryId: string;
  description?: string;
  occurredAt?: string;
};
export type UpdateTransactionInput = { id: string; changes: Partial<TransactionInput> };
export type AccountInput = {
  name: string;
  type: "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "SAVINGS" | "INVESTMENT";
  currency?: string;
  icon?: string | null;
  openingBalance?: number;
  creditLimit?: number | null;
  institution?: string;
  lastFourDigits?: string;
  color?: string | null;
  isDefault?: boolean;
  includeInNetWorth?: boolean;
};
export type UpdateAccountInput = { id: string; changes: Partial<Omit<AccountInput, "currency" | "institution" | "lastFourDigits">> & { institution?: string | null; lastFourDigits?: string | null; isDefault?: boolean; includeInNetWorth?: boolean } };
export type CategoryInput = { name: string; type: CategoryType; icon?: string; color?: string };
export type UpdateCategoryInput = { id: string; changes: { name?: string; icon?: string | null; color?: string | null } };

export function useCreateTransaction() {
  return useFinanceMutation<TransactionInput, { id: string }>(() => "/api/transactions", "POST", p => p, finance);
}
export function useUpdateTransaction() {
  return useFinanceMutation<UpdateTransactionInput, { id: string }>(p => `/api/transactions/${encodeURIComponent(p.id)}`, "PUT", p => p.changes, finance);
}
export function useDeleteTransaction() {
  return useFinanceMutation<string, unknown>(p => `/api/transactions/${encodeURIComponent(p)}`, "DELETE", () => undefined, finance);
}
export function useCreateAccount() {
  return useFinanceMutation<AccountInput, { id: string; name: string; type: AccountInput["type"]; openingBalance: number; creditLimit: number | null }>(() => "/api/account", "POST", p => p, accounts);
}
export function useUpdateAccount() {
  return useFinanceMutation<UpdateAccountInput, { id: string }>(p => `/api/account/${encodeURIComponent(p.id)}`, "PUT", p => p.changes, accounts);
}
export type DeletionRequest = { id: string; force?: boolean };
export function useDeleteAccount() {
  return useFinanceMutation<DeletionRequest, { id: string; deleted: boolean; deletedTransactions?: number }>(
    p => `/api/account/${encodeURIComponent(p.id)}${p.force ? "?force=true" : ""}`,
    "DELETE", () => undefined, finance,
  );
}
export function useRestoreAccount() {
  return useFinanceMutation<string, { id: string }>(
    id => `/api/account/${encodeURIComponent(id)}`,
    "PATCH", () => ({ restore: true }), accounts,
  );
}
export function useCreateCategory() {
  return useFinanceMutation<CategoryInput, { id: string; name: string; type: CategoryType; icon: string | null; color: string | null }>(() => "/api/category", "POST", p => p, ["categories"]);
}
export function useUpdateCategory() {
  return useFinanceMutation<UpdateCategoryInput, { id: string }>(p => `/api/category/${encodeURIComponent(p.id)}`, "PUT", p => p.changes, ["categories"]);
}
export function useDeleteCategory() {
  return useFinanceMutation<DeletionRequest, { id: string; deleted: boolean; unlinkedTransactions?: number }>(
    p => `/api/category/${encodeURIComponent(p.id)}${p.force ? "?force=true" : ""}`,
    "DELETE", () => undefined,
    ["categories", "transactions", "summary", "stats", "budgets", "accountAnalytics"],
  );
}
export function useRestoreCategory() {
  return useFinanceMutation<string, { id: string }>(
    id => `/api/category/${encodeURIComponent(id)}`,
    "PATCH", () => ({ restore: true }), ["categories"],
  );
}
export function useUpdateProfile() {
  return useFinanceMutation<{ firstName?: string; lastName?: string | null; displayName?: string | null; email?: string }, { id: string; firstName: string; email: string; lastName: string | null; displayName: string | null }>(() => "/api/user/profile", "PUT", p => p, ["profile"]);
}
export function useChangePassword() {
  return useFinanceMutation<{ currentPassword: string; newPassword: string }, { requiresLogin: boolean }>(() => "/api/user/password", "PUT", p => p, []);
}
export function useDeleteUser() {
  return useFinanceMutation<{ password: string }, { deleted: boolean }>(() => "/api/user", "DELETE", p => p, []);
}
