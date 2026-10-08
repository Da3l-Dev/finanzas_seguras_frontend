import { useAuth } from "@/context/AuthContext";
import { useDeleteAccount } from "@/hooks/mutations/useFinanceMutations";
import {
  useAccountAnalytics,
  useAccounts,
  type Account,
} from "@/hooks/queries/useAccounts";
import { confirmAccountDeletion } from "@/lib/deletionConfirm";
import { getQueryErrorMessage } from "@/lib/queryUtils";
import ModalNewAccount from "@/ui/components/modalNewAccount";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
type AccountMetric = {
  id: string;
  name: string;
  type: string;
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

type MonthBucket = {
  year: number;
  month: number;
  label: string;
  spent: number;
  income: number;
  count: number;
};

type Analytics = {
  totalBalance: number;
  accounts: AccountMetric[];
  monthlySpending: MonthBucket[];
  totals: {
    monthSpent: number;
    monthIncome: number;
    monthCount: number;
    avgPerTx: number;
  };
  topSpendingAccountId: string | null;
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
const formatMXN = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatShort = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
};

const LABEL_TIPO: Record<string, string> = {
  CASH: "Efectivo",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  SAVINGS: "Ahorro",
  INVESTMENT: "Inversión",
};

const ICON_FALLBACK_TIPO: Record<string, string> = {
  CASH: "cash",
  DEBIT_CARD: "credit-card",
  CREDIT_CARD: "credit-card-outline",
  SAVINGS: "piggy-bank",
  INVESTMENT: "chart-line",
};

// ═══════════════════════════════════════════════════════════════
// Componente
// ═══════════════════════════════════════════════════════════════
export default function Accounts() {
  const { isLoading: authLoading } = useAuth();
  const {
    data,
    isPending: loading,
    isRefetching: refreshing,
    error: queryError,
    refetch,
  } = useAccountAnalytics();
  const error = queryError ? getQueryErrorMessage(queryError) : null;
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
  const deleteAccount = useDeleteAccount();
  const allAccounts = useAccounts();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const cargar = (_isRefresh?: boolean) => {
    void refetch();
  };
  const handleCuentaCreada = () => {
    /* La invalidación la realiza React Query. */
  };

  const editarCuenta = (cuenta: AccountMetric) => {
    const full = allAccounts.data?.find((a) => a.id === cuenta.id);
    if (!full) {
      Alert.alert(
        "Cargando cuenta",
        "Todavía estamos obteniendo los datos. Vuelve a intentar.",
      );
      void allAccounts.refetch();
      return;
    }
    setEditingAccount(full);
    setShowNuevaCuenta(true);
  };

  const confirmarEliminar = (cuenta: AccountMetric) => {
    confirmAccountDeletion(cuenta.name, deleteAccount.mutateAsync, cuenta.id);
  };

  const abrirMenuCuenta = (cuenta: AccountMetric) => {
    Alert.alert(cuenta.name, LABEL_TIPO[cuenta.type] ?? cuenta.type, [
      { text: "Cancelar", style: "cancel" },
      { text: "Editar", onPress: () => editarCuenta(cuenta) },
      {
        text: "Eliminar de la base de datos",
        style: "destructive",
        onPress: () => confirmarEliminar(cuenta),
      },
    ]);
  };

  // Loading inicial
  if (authLoading || (loading && !data)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f7f4f4] dark:bg-[#141313]">
        <ActivityIndicator color="#10b981" />
      </SafeAreaView>
    );
  }

  // Sin cuentas → CTA
  if (!data || data.accounts.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-manrope-bold text-[24px] text-slate-900 dark:text-white">
            Cuentas
          </Text>
          <Pressable
            onPress={() => router.push("/accounts-archived")}
            className="ml-auto mr-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800"
          >
            <Text className="font-manrope-bold text-[12px] text-slate-600 dark:text-white">
              Archivadas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setEditingAccount(null);
              setShowNuevaCuenta(true);
            }}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#0f172a]"
          >
            <MaterialCommunityIcons name="plus" size={20} color="#10b981" />
          </Pressable>
        </View>

        <View className="mx-5 mt-8 items-center rounded-3xl bg-white p-8 dark:bg-[#0f172a]">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
            <MaterialCommunityIcons
              name="wallet-outline"
              size={32}
              color="#10b981"
            />
          </View>
          <Text className="mt-4 font-manrope-bold text-[16px] text-slate-900 dark:text-white">
            Sin cuentas todavía
          </Text>
          <Text className="mt-1 text-center font-manrope text-[13px] text-slate-500">
            Crea tu primera cuenta para empezar a registrar gastos y ver tus
            métricas aquí.
          </Text>
          <Pressable
            onPress={() => setShowNuevaCuenta(true)}
            className="mt-5 flex-row items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5"
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text className="font-manrope-bold text-[14px] text-white">
              Crear mi primera cuenta
            </Text>
          </Pressable>
        </View>

        <ModalNewAccount
          visible={showNuevaCuenta}
          onClose={() => {
            setShowNuevaCuenta(false);
            setEditingAccount(null);
          }}
          onCrear={handleCuentaCreada}
          editing={editingAccount}
        />
      </SafeAreaView>
    );
  }

  // Vista normal
  const maxSpent = Math.max(...data.accounts.map((a) => a.spent6m), 1);
  const totalSpent6m = data.accounts.reduce((s, a) => s + a.spent6m, 0);
  const maxMonthly = Math.max(...data.monthlySpending.map((m) => m.spent), 1);
  const soloUnaCuenta = data.accounts.length === 1;

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargar(true)}
            tintColor="#10b981"
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-manrope-bold text-[24px] text-slate-900 dark:text-white">
            Cuentas
          </Text>
          <Pressable
            onPress={() => router.push("/accounts-archived")}
            className="ml-auto mr-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800"
          >
            <Text className="font-manrope-bold text-[12px] text-slate-600 dark:text-white">
              Archivadas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setEditingAccount(null);
              setShowNuevaCuenta(true);
            }}
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#0f172a]"
          >
            <MaterialCommunityIcons name="plus" size={20} color="#10b981" />
          </Pressable>
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

        {/* Aviso si solo queda una cuenta */}

        {/* Patrimonio */}
        <View className="mx-5 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <Text className="font-manrope-medium text-[13px] text-slate-500 dark:text-slate-400">
            Patrimonio total
          </Text>
          <Text className="mt-1 font-manrope-bold text-[32px] text-slate-900 dark:text-white">
            ${formatMXN(data.totalBalance)}
          </Text>
          <Text className="mt-1 font-manrope text-[11px] text-slate-400">
            {data.accounts.length}{" "}
            {data.accounts.length === 1 ? "cuenta activa" : "cuentas activas"}
          </Text>
        </View>

        {/* Este mes */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-manrope-bold text-[14px] text-slate-900 dark:text-white">
              Este mes
            </Text>
            <Text className="font-manrope text-[11px] text-slate-400">
              {data.totals.monthCount} movimientos
            </Text>
          </View>
          <View className="flex-row">
            <View className="flex-1">
              <Text className="font-manrope text-[11px] uppercase tracking-wide text-slate-400">
                Gastado
              </Text>
              <Text className="mt-1 font-manrope-bold text-[18px] text-rose-500">
                ${formatMXN(data.totals.monthSpent)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-manrope text-[11px] uppercase tracking-wide text-slate-400">
                Promedio
              </Text>
              <Text className="mt-1 font-manrope-bold text-[18px] text-slate-900 dark:text-white">
                ${formatMXN(data.totals.avgPerTx)}
              </Text>
            </View>
          </View>
        </View>

        {/* Gasto mensual */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-manrope-bold text-[14px] text-slate-900 dark:text-white">
              Gasto mensual
            </Text>
            <Text className="font-manrope text-[11px] text-slate-400">
              Últimos 6 meses
            </Text>
          </View>

          <View className="h-32 flex-row items-end justify-between gap-2">
            {data.monthlySpending.map((m) => {
              const h = maxMonthly > 0 ? (m.spent / maxMonthly) * 100 : 0;
              return (
                <View
                  key={`${m.year}-${m.month}`}
                  className="flex-1 items-center"
                >
                  <Text className="mb-1 font-manrope text-[10px] text-slate-400">
                    {m.spent > 0 ? `$${formatShort(m.spent)}` : ""}
                  </Text>
                  <View className="h-20 w-full justify-end overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    <View
                      className="w-full rounded-lg bg-rose-500"
                      style={{ height: `${Math.max(4, h)}%` }}
                    />
                  </View>
                  <Text className="mt-1 font-manrope text-[11px] capitalize text-slate-500">
                    {m.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Ranking */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-manrope-bold text-[14px] text-slate-900 dark:text-white">
              En qué cuenta gastas más
            </Text>
            <Text className="font-manrope text-[11px] text-slate-400">
              Últimos 6 meses
            </Text>
          </View>

          {totalSpent6m === 0 ? (
            <View className="items-center py-4">
              <MaterialCommunityIcons
                name="chart-donut"
                size={28}
                color="#94a3b8"
              />
              <Text className="mt-2 font-manrope text-[12px] text-slate-500">
                Sin gastos registrados todavía
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {data.accounts
                .filter((a) => a.spent6m > 0)
                .map((a) => {
                  const pct = (a.spent6m / totalSpent6m) * 100;
                  const barPct = (a.spent6m / maxSpent) * 100;
                  const color = a.color ?? "#e11d48";
                  const isTop = a.id === data.topSpendingAccountId;
                  return (
                    <View key={a.id}>
                      <View className="mb-1 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <MaterialCommunityIcons
                            name={
                              (a.icon as any) ??
                              ICON_FALLBACK_TIPO[a.type] ??
                              "wallet"
                            }
                            size={14}
                            color={color}
                          />
                          <Text className="font-manrope-medium text-[13px] text-slate-700 dark:text-slate-200">
                            {a.name}
                          </Text>
                          {isTop && (
                            <View className="rounded-full bg-rose-100 px-2 py-0.5 dark:bg-rose-950/40">
                              <Text className="font-manrope-bold text-[9px] text-rose-600 dark:text-rose-400">
                                TOP
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="font-manrope-bold text-[13px] text-slate-900 dark:text-white">
                          ${formatMXN(a.spent6m)}
                        </Text>
                      </View>
                      <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${barPct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </View>
                      <Text className="mt-1 font-manrope text-[10px] text-slate-400">
                        {pct.toFixed(0)}% del total · {a.txCount6m}{" "}
                        {a.txCount6m === 1 ? "uso" : "usos"}
                      </Text>
                    </View>
                  );
                })}
            </View>
          )}
        </View>

        {/* Detalle por cuenta */}
        <View className="mx-5 mt-4 gap-3">
          {data.accounts.map((cuenta) => {
            const esCredito = cuenta.type === "CREDIT_CARD";
            const esDeuda = cuenta.currentBalance < 0;
            const color = esDeuda ? "#e11d48" : (cuenta.color ?? "#10b981");
            const used = Math.abs(Math.min(0, cuenta.currentBalance));
            const pctUsed =
              esCredito && cuenta.creditLimit
                ? Math.min(100, (used / cuenta.creditLimit) * 100)
                : null;
            const isDeleting =
              deleteAccount.isPending &&
              deleteAccount.variables?.id === cuenta.id;

            return (
              <View
                key={cuenta.id}
                className={`rounded-3xl bg-white p-4 dark:bg-[#0f172a] ${
                  isDeleting ? "opacity-50" : ""
                }`}
              >
                {/* ── Fila 1: info + saldo + menú ── */}
                <View className="flex-row items-center justify-between">
                  {/* Izquierda: icono + nombre */}
                  <View className="mr-3 flex-1 flex-row items-center gap-3">
                    <View
                      style={{ backgroundColor: `${color}20` }}
                      className="h-10 w-10 items-center justify-center rounded-full"
                    >
                      <MaterialCommunityIcons
                        name={
                          (cuenta.icon as any) ??
                          ICON_FALLBACK_TIPO[cuenta.type] ??
                          "wallet"
                        }
                        size={18}
                        color={color}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-manrope-bold text-[15px] text-slate-900 dark:text-white"
                      >
                        {cuenta.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="font-manrope text-[11px] text-slate-400"
                      >
                        {LABEL_TIPO[cuenta.type] ?? cuenta.type}
                        {cuenta.isDefault && " · principal"}
                      </Text>
                    </View>
                  </View>

                  {/* Derecha: saldo + menú */}
                  <View className="flex-row items-center gap-1">
                    <Text
                      className={`font-manrope-bold text-[16px] ${
                        esDeuda
                          ? "text-rose-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {esDeuda ? "-" : ""}$
                      {formatMXN(Math.abs(cuenta.currentBalance))}
                    </Text>

                    {isDeleting ? (
                      <ActivityIndicator
                        color="#e11d48"
                        size="small"
                        style={{ marginLeft: 6 }}
                      />
                    ) : (
                      <Pressable
                        onPress={() => abrirMenuCuenta(cuenta)}
                        hitSlop={10}
                        className="ml-1 h-8 w-8 items-center justify-center"
                      >
                        <MaterialCommunityIcons
                          name="dots-vertical"
                          size={20}
                          color="#94a3b8"
                        />
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* ── Barra de crédito (si aplica) ── */}
                {esCredito && pctUsed !== null && (
                  <View className="mt-3">
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text className="font-manrope text-[11px] text-slate-400">
                        {pctUsed.toFixed(0)}% del límite usado
                      </Text>
                      {cuenta.creditLimit && (
                        <Text className="font-manrope text-[11px] text-slate-400">
                          Límite ${formatMXN(cuenta.creditLimit)}
                        </Text>
                      )}
                    </View>
                    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${pctUsed}%`,
                          backgroundColor:
                            pctUsed > 70
                              ? "#e11d48"
                              : pctUsed > 40
                                ? "#f59e0b"
                                : "#10b981",
                        }}
                      />
                    </View>
                    {pctUsed > 70 && (
                      <View className="mt-2 flex-row items-center gap-1.5 rounded-2xl bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                        <MaterialCommunityIcons
                          name="alert"
                          size={14}
                          color="#e11d48"
                        />
                        <Text className="flex-1 font-manrope-medium text-[11px] text-rose-600 dark:text-rose-400">
                          Cuidado, usaste más del 70% de tu crédito
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* ── Divisor ── */}
                <View className="my-3 h-[1px] bg-slate-100 dark:bg-slate-800" />

                {/* ── Botones Editar / Eliminar (fila propia, full width) ── */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => editarCuenta(cuenta)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 dark:bg-slate-800"
                  >
                    <MaterialCommunityIcons
                      name="pencil-outline"
                      size={16}
                      color="#10b981"
                    />
                    <Text className="font-manrope-bold text-[12px] text-slate-700 dark:text-white">
                      Editar
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => confirmarEliminar(cuenta)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-rose-50 py-2.5 dark:bg-rose-950/30"
                  >
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={16}
                      color="#e11d48"
                    />
                    <Text className="font-manrope-bold text-[12px] text-rose-600">
                      Eliminar
                    </Text>
                  </Pressable>
                </View>

                {/* ── Métricas rápidas ── */}
                <View className="mt-3 w-full flex-row justify-evenly">
                  <View className="items-center">
                    <Text className="font-manrope text-[10px] uppercase tracking-wide text-slate-400">
                      Gasto/mes
                    </Text>
                    <Text className="mt-1 font-manrope-bold text-[14px] text-rose-500">
                      ${formatMXN(cuenta.monthlyAvg)}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="font-manrope text-[10px] uppercase tracking-wide text-slate-400">
                      Promedio
                    </Text>
                    <Text className="mt-1 font-manrope-bold text-[14px] text-slate-900 dark:text-white">
                      ${formatMXN(cuenta.avgTx)}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="font-manrope text-[10px] uppercase tracking-wide text-slate-400">
                      Usos
                    </Text>
                    <Text className="mt-1 font-manrope-bold text-[14px] text-slate-900 dark:text-white">
                      {cuenta.txCount6m}
                    </Text>
                  </View>
                </View>

                {cuenta.lastUsedAt && (
                  <Text className="mt-3 font-manrope text-[10px] text-slate-400">
                    Última vez usado:{" "}
                    {new Date(cuenta.lastUsedAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <ModalNewAccount
        visible={showNuevaCuenta}
        onClose={() => {
          setShowNuevaCuenta(false);
          setEditingAccount(null);
        }}
        onCrear={handleCuentaCreada}
        editing={editingAccount}
      />
    </SafeAreaView>
  );
}
