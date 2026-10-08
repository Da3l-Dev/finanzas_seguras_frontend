import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { queryFetch } from "@/lib/queryUtils";
import { queryKeys } from "@/lib/queryKeys";
export type Goal = { id: string; name: string; description: string | null; targetAmount: number; savedAmount: number; targetDate: string | null };
export type Budget = { id: string; categoryId: string; allocatedAmount: number; spent: number; warningPercent: number; category: { name: string; color: string | null; icon: string | null } };
export function useGoals() {
  const { user, token, isLoading } = useAuth();
  return useQuery<Goal[]>({ queryKey: queryKeys.goals(user?.id ?? ""), queryFn: () => queryFetch<Goal[]>("/api/goals", token!), enabled: !isLoading && !!user && !!token });
}
export function useBudgets(month: string) {
  const { user, token, isLoading } = useAuth();
  return useQuery<Budget[]>({ queryKey: [...queryKeys.budgets(user?.id ?? ""), month], queryFn: () => queryFetch<Budget[]>(`/api/budgets?month=${encodeURIComponent(month)}`, token!), enabled: !isLoading && !!user && !!token });
}
