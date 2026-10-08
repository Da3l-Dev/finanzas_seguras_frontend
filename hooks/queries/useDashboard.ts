import { useAuth } from "@/context/AuthContext";
import { queryKeys, type StatsPeriod } from "@/lib/queryKeys";
import { queryFetch } from "@/lib/queryUtils";
import { useQuery } from "@tanstack/react-query";

export type DashboardData = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyNet: number;
  todaySpent: number;
  thisWeekSpent: number;
  lastWeekSpent: number;
  weekDelta: number | null;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    currency: string;
    color: string | null;
    icon: string | null;
    isDefault: boolean;
    currentBalance: number;
  }>;
  spendingByCategory: Array<{
    categoryId: string;
    name: string;
    color: string | null;
    icon: string | null;
    total: number;
    count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    occurredAt: string;
    description: string | null;
    category: {
      id: string;
      name: string;
      color: string | null;
      icon: string | null;
    } | null;
    sourceAccount: { id: string; name: string } | null;
  }>;
};
export type StatsData = {
  period: StatsPeriod;
  start: string;
  end: string;
  totalGastado: number;
  totalIngresado: number;
  cambioPorcentaje: number;
  promedioDiario: number;
  gastoMasAlto: { monto: number; descripcion: string };
  numTransacciones: number;
  categorias: Array<{
    categoryId: string;
    nombre: string;
    icon: string | null;
    color: string | null;
    total: number;
    count: number;
  }>;
  barras: Array<{ label: string; monto: number; esActual?: boolean }>;
};

export function useDashboard() {
  const { user, token, isLoading } = useAuth();
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard(user?.id ?? ""),
    queryFn: async () => {
      const res = await queryFetch<DashboardData>(
        "/api/dashboard/summary",
        token!,
      );
      console.log(
        "[Dashboard] Respuesta del backend:",
        JSON.stringify(res, null, 2),
      );
      return res;
    },
    enabled: !isLoading && !!user && !!token,
  });
}
export const useSummary = useDashboard;
export function useStats(period: StatsPeriod = "MES") {
  const { user, token, isLoading } = useAuth();
  return useQuery<StatsData>({
    queryKey: queryKeys.stats(user?.id ?? "", period),
    queryFn: () =>
      queryFetch<StatsData>(
        `/api/stats/summary?period=${encodeURIComponent(period)}`,
        token!,
      ),
    enabled: !isLoading && !!user && !!token,
  });
}
