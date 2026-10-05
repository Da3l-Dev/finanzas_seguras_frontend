import { useAuth } from "@/context/AuthContext";
import { ApiError, apiFetch } from "@/lib/api";
import ModalCreateFinances from "@/ui/components/modalCreateFinances";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════════
type DashboardData = {
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

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function formatMoney(n: number) {
  return n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) {
    return d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

const ICON_CATEGORY_FALLBACK = "shape";

// ═══════════════════════════════════════════════════════════════
// Componente
// ═══════════════════════════════════════════════════════════════
export default function Inicio() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await apiFetch<{ success: boolean; data: DashboardData }>(
          "/api/dashboard/summary",
          { method: "GET" },
          token,
        );
        setData(res.data);
      } catch (e) {
        if (e instanceof ApiError) setError(e.message);
        else if (e instanceof Error) setError(e.message);
        else setError("No se pudo cargar el resumen.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (authLoading || !token) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch<{ success: boolean; data: DashboardData }>(
          "/api/dashboard/summary",
          { method: "GET" },
          token,
        );
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof ApiError) setError(e.message);
          else if (e instanceof Error) setError(e.message);
          else setError("No se pudo cargar el resumen.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, authLoading]);

  const handleCreated = () => {
    // Refresca todo el dashboard cuando el usuario crea una transacción
    cargar(true);
  };

  if (authLoading || (loading && !data)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f7f4f4] dark:bg-[#141313]">
        <ActivityIndicator color="#10b981" />
        <Text className="mt-3 font-manrope text-[13px] text-slate-500">
          Cargando tu dinero…
        </Text>
      </SafeAreaView>
    );
  }

  const total = data?.totalBalance ?? 0;
  const income = data?.monthlyIncome ?? 0;
  const expense = data?.monthlyExpense ?? 0;
  const net = data?.monthlyNet ?? 0;
  const hasAccounts = (data?.accounts?.length ?? 0) > 0;
  const hasTransactions = (data?.recentTransactions?.length ?? 0) > 0;

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargar(true)}
            tintColor="#10b981"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center px-5 py-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
            <Text className="font-manrope-bold text-[15px] text-white">
              {(
                user?.firstName?.[0] ??
                user?.displayName?.[0] ??
                "?"
              ).toUpperCase()}
            </Text>
          </View>
          <View className="ml-3">
            <Text className="font-manrope text-[12px] text-slate-500">
              Hola de nuevo
            </Text>
            <Text className="font-manrope-bold text-[18px] text-slate-900 dark:text-white">
              {user?.displayName ?? user?.firstName ?? "Usuario"}
            </Text>
          </View>
        </View>

        {/* Error */}
        {error && (
          <View className="mx-5 mb-3 flex-row items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={16}
              color="#e11d48"
            />
            <Text className="flex-1 font-manrope text-[12px] text-rose-600 dark:text-rose-400">
              {error}
            </Text>
          </View>
        )}

        {/* Saldo total */}
        <View className="mx-5 rounded-3xl bg-[#0f172a] p-5 dark:bg-[#0f172a]">
          <Text className="font-manrope-medium text-[13px] text-slate-400">
            Saldo total
          </Text>
          <Text className="mt-1 font-manrope-bold text-[36px] leading-tight text-white">
            ${formatMoney(total)}
          </Text>

          {hasAccounts && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {data!.accounts.slice(0, 3).map((a) => (
                <View
                  key={a.id}
                  className="rounded-full bg-white/10 px-3 py-1.5"
                >
                  <Text className="font-manrope text-[11px] text-white/90">
                    {a.name} · ${formatMoney(a.currentBalance)}
                  </Text>
                </View>
              ))}
              {data!.accounts.length > 3 && (
                <View className="rounded-full bg-white/10 px-3 py-1.5">
                  <Text className="font-manrope text-[11px] text-white/90">
                    +{data!.accounts.length - 3} más
                  </Text>
                </View>
              )}
            </View>
          )}

          {!hasAccounts && (
            <Text className="mt-3 font-manrope text-[12px] text-slate-400">
              Aún no tienes cuentas. Crea una para empezar.
            </Text>
          )}
        </View>

        {/* Ingreso / Gasto del mes */}
        <View className="mx-5 my-4 rounded-2xl bg-white px-4 py-4 dark:bg-[#0f172a]">
          <Text className="mb-3 font-manrope-medium text-[11px] uppercase tracking-wider text-slate-400">
            Este mes
          </Text>
          <View className="flex-row items-center">
            <View className="w-1/2 items-start">
              <View className="flex-row items-center gap-1.5">
                <MaterialCommunityIcons
                  name="arrow-down"
                  size={14}
                  color="#10b981"
                />
                <Text className="font-manrope text-[12px] text-slate-500">
                  Ingresos
                </Text>
              </View>
              <Text className="mt-1 font-manrope-bold text-[20px] text-emerald-500">
                ${formatMoney(income)}
              </Text>
            </View>

            <View className="h-12 w-[1px] bg-slate-200 dark:bg-slate-700" />

            <View className="w-1/2 items-start pl-4">
              <View className="flex-row items-center gap-1.5">
                <MaterialCommunityIcons
                  name="arrow-up"
                  size={14}
                  color="#e11d48"
                />
                <Text className="font-manrope text-[12px] text-slate-500">
                  Gastos
                </Text>
              </View>
              <Text className="mt-1 font-manrope-bold text-[20px] text-rose-500">
                ${formatMoney(expense)}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
            <Text className="font-manrope text-[12px] text-slate-500">
              Balance del mes
            </Text>
            <Text
              className={`font-manrope-bold text-[13px] ${
                net >= 0 ? "text-emerald-500" : "text-rose-500"
              }`}
            >
              {net >= 0 ? "+" : ""}${formatMoney(net)}
            </Text>
          </View>
        </View>

        {/* Resumen de la semana */}
        <View className="mx-5 mb-4 flex-row gap-3">
          <View className="flex-1 rounded-2xl bg-white p-4 dark:bg-[#0f172a]">
            <Text className="font-manrope text-[11px] uppercase tracking-wider text-slate-400">
              Hoy
            </Text>
            <Text className="mt-1 font-manrope-bold text-[18px] text-slate-900 dark:text-white">
              ${formatMoney(data?.todaySpent ?? 0)}
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-white p-4 dark:bg-[#0f172a]">
            <Text className="font-manrope text-[11px] uppercase tracking-wider text-slate-400">
              Esta semana
            </Text>
            <Text className="mt-1 font-manrope-bold text-[18px] text-slate-900 dark:text-white">
              ${formatMoney(data?.thisWeekSpent ?? 0)}
            </Text>
            {data?.weekDelta != null && (
              <View className="mt-1 flex-row items-center gap-1">
                <MaterialCommunityIcons
                  name={data.weekDelta >= 0 ? "trending-up" : "trending-down"}
                  size={12}
                  color={data.weekDelta >= 0 ? "#e11d48" : "#10b981"}
                />
                <Text
                  className={`font-manrope text-[11px] ${
                    data.weekDelta >= 0 ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  {Math.abs(data.weekDelta).toFixed(0)}% vs anterior
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* En qué gastaste (top categorías) */}
        {data && data.spendingByCategory.length > 0 && (
          <View className="mx-5 mb-4 rounded-2xl bg-white p-5 dark:bg-[#0f172a]">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-manrope-bold text-[15px] text-slate-900 dark:text-white">
                En qué gastaste
              </Text>
              <Text className="font-manrope text-[11px] text-slate-400">
                Este mes
              </Text>
            </View>

            <View className="gap-3">
              {data.spendingByCategory.map((c) => {
                const pct =
                  data.monthlyExpense > 0
                    ? (c.total / data.monthlyExpense) * 100
                    : 0;
                const color = c.color ?? "#e11d48";
                return (
                  <View key={c.categoryId}>
                    <View className="mb-1 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <MaterialCommunityIcons
                            name={(c.icon as any) ?? ICON_CATEGORY_FALLBACK}
                            size={14}
                            color={color}
                          />
                        </View>
                        <Text className="font-manrope-medium text-[13px] text-slate-700 dark:text-slate-200">
                          {c.name}
                        </Text>
                      </View>
                      <Text className="font-manrope-bold text-[13px] text-slate-900 dark:text-white">
                        ${formatMoney(c.total)}
                      </Text>
                    </View>
                    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, pct)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </View>
                    <Text className="mt-1 font-manrope text-[10px] text-slate-400">
                      {pct.toFixed(0)}% · {c.count}{" "}
                      {c.count === 1 ? "movimiento" : "movimientos"}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Últimos movimientos */}
        <View className="mx-5">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-manrope-bold text-[15px] text-slate-900 dark:text-white">
              Últimos movimientos
            </Text>
          </View>

          {!hasTransactions && (
            <View className="items-center rounded-2xl bg-white p-8 dark:bg-[#0f172a]">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                <MaterialCommunityIcons
                  name="receipt"
                  size={26}
                  color="#94a3b8"
                />
              </View>
              <Text className="mt-4 text-center font-manrope-bold text-[14px] text-slate-900 dark:text-white">
                Sin movimientos todavía
              </Text>
              <Text className="mt-1 text-center font-manrope text-[12px] text-slate-500">
                Toca el botón + para registrar tu primer gasto o ingreso.
              </Text>
            </View>
          )}

          {data?.recentTransactions.map((t) => {
            const isExpense = t.type === "EXPENSE";
            const color =
              t.category?.color ?? (isExpense ? "#e11d48" : "#10b981");
            const icon = t.category?.icon ?? (isExpense ? "cart" : "cash");
            return (
              <View
                key={t.id}
                className="mb-2 flex-row items-center gap-3 rounded-2xl bg-white p-3.5 dark:bg-[#0f172a]"
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <MaterialCommunityIcons
                    name={(icon as any) ?? "cart"}
                    size={18}
                    color={color}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-manrope-bold text-[14px] text-slate-900 dark:text-white"
                  >
                    {t.description?.trim() ||
                      t.category?.name ||
                      (isExpense ? "Gasto" : "Ingreso")}
                  </Text>
                  <Text className="font-manrope text-[11px] text-slate-500">
                    {t.sourceAccount?.name ?? "Sin cuenta"} ·{" "}
                    {formatShortDate(t.occurredAt)}
                  </Text>
                </View>
                <Text
                  className={`font-manrope-bold text-[14px] ${
                    isExpense ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  {isExpense ? "-" : "+"}${formatMoney(t.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Botón flotante */}
      <Pressable
        className="absolute bottom-5 right-5 z-10 h-14 w-14 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </Pressable>

      {/* Modal */}
      <ModalCreateFinances
        modalVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        onCreated={handleCreated}
      />
    </SafeAreaView>
  );
}
