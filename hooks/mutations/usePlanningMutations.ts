import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { sendFinance } from "@/hooks/mutations/useFinanceMutations";

function usePlanMutation<T>(path: (input: T) => string, method: "POST" | "PUT" | "DELETE", body: (input: T) => unknown, prefix: "goals" | "budgets") {
  const { user, token } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) => {
      if (!token) throw new Error("Inicia sesión nuevamente.");
      return sendFinance<unknown>(path(input), method, token, body(input));
    },
    onSuccess: () => client.invalidateQueries({ queryKey: [prefix, user?.id ?? ""] }),
  });
}
export const useCreateGoal = () => usePlanMutation<{ name: string; targetAmount: number }>(() => "/api/goals", "POST", p => p, "goals");
export const useUpdateGoal = () => usePlanMutation<{ id: string; name: string; targetAmount: number }>(p => `/api/goals/${p.id}`, "PUT", p => ({ name: p.name, targetAmount: p.targetAmount }), "goals");
export const useDeleteGoal = () => usePlanMutation<string>(p => `/api/goals/${p}`, "DELETE", () => undefined, "goals");
export const useContributeGoal = () => usePlanMutation<{ id: string; amount: number }>(p => `/api/goals/${p.id}/contributions`, "POST", p => ({ amount: p.amount }), "goals");
export const useSaveBudget = () => usePlanMutation<{ categoryId: string; allocatedAmount: number; month: string }>(() => "/api/budgets", "POST", p => p, "budgets");
export const useDeleteBudget = () => usePlanMutation<string>(p => `/api/budgets/${p}`, "DELETE", () => undefined, "budgets");
