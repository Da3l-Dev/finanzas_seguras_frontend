import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { toIconName } from "@/lib/icons";
import { getQueryErrorMessage } from "@/lib/queryUtils";
import ModalCreateFinances from "@/ui/components/modalCreateFinances";

// Ambas paletas conservan el mismo diseño, espaciado e información.
const DARK = {
  background: "#0C1014",
  card: "#171D24",
  border: "#29323C",
  text: "#F4F7FA",
  muted: "#9CA8B6",
  green: "#3DE0A2",
  red: "#FB6D79",
  track: "#2A313B",
  chipGreen: "#194735",
  chipRed: "#4A2934",
  avatar: "#173F33",
  avatarBorder: "#286A52",
  errorBg: "#3C232B",
  errorBorder: "#683744",
  errorText: "#FFADB4",
  separator: "#26303A",
  balanceLabel: "#B6C8C6",
  balanceMuted: "#A6B7B5",
  balanceIcon: "#AFC6C2",
  balanceText: "#F4F7FA",
  netBg: "#145B45",
} as const;

const LIGHT = {
  background: "#F5F7F8",
  card: "#FFFFFF",
  border: "#E4EAF0",
  text: "#17252E",
  muted: "#697A88",
  green: "#07896D",
  red: "#D84962",
  track: "#EBF0F3",
  chipGreen: "#DCF6E9",
  chipRed: "#FCE6EA",
  avatar: "#E0F7EA",
  avatarBorder: "#A8E1C8",
  errorBg: "#FFF0F2",
  errorBorder: "#F7BEC8",
  errorText: "#B33B52",
  separator: "#EDF1F4",
  balanceLabel: "#50746B",
  balanceMuted: "#547D70",
  balanceIcon: "#437668",
  balanceText: "#18392D",
  netBg: "#C9EBD8",
} as const;

type DashboardPalette = typeof DARK | typeof LIGHT;

function money(amount: number): string {
  const normalized = Number.isFinite(amount) ? amount : 0;
  const sign = normalized < 0 ? "−" : "";
  return `${sign}$${Math.abs(normalized).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function shortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";

  const now = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(date, now)) {
    return `Hoy, ${date.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Ayer";

  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

// Algunos registros antiguos pueden tener colores no válidos.
function safeColor(color: string | null, fallback: string): string {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function SectionTitle({
  title,
  action,
  onPress,
  palette: C,
}: {
  title: string;
  action: string;
  onPress: () => void;
  palette: DashboardPalette;
}) {
  return (
    <View className="mb-5 flex-row items-center justify-between">
      <Text className="font-manrope-bold text-[17px]" style={{ color: C.text }}>
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={action}
        onPress={onPress}
        hitSlop={8}
        className="flex-row items-center"
      >
        <Text
          className="mr-1 font-manrope text-[12px]"
          style={{ color: C.muted }}
        >
          {action}
        </Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={19}
          color={C.muted}
        />
      </Pressable>
    </View>
  );
}

export default function Inicio() {
  const { resolvedTheme } = useAppTheme();
  const isDark = resolvedTheme === "dark";
  const C = isDark ? DARK : LIGHT;
  const { user, isLoading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const { data, isPending, isRefetching, error, refetch } = useDashboard();

  const categories = useMemo(
    () =>
      [...(data?.spendingByCategory ?? [])]
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    [data?.spendingByCategory],
  );

  const transactions = data?.recentTransactions.slice(0, 5) ?? [];
  const total = data?.totalBalance ?? 0;
  const income = data?.monthlyIncome ?? 0;
  const expenses = data?.monthlyExpense ?? 0;
  const monthNet = data?.monthlyNet ?? 0;
  const displayName =
    user?.firstName?.trim() || user?.displayName?.trim() || "Usuario";
  const initial = displayName.charAt(0).toUpperCase();
  const formatBalance = showBalance ? money(total) : "••••••••";

  if (authLoading || (isPending && !data)) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: C.background }}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator color={C.green} size="large" />
        <Text
          className="mt-4 font-manrope text-[13px]"
          style={{ color: C.muted }}
        >
          Preparando tus finanzas…
        </Text>
      </SafeAreaView>
    );
  }

  if (error && !data) {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center px-8"
        style={{ backgroundColor: C.background }}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <MaterialCommunityIcons
          name="cloud-alert-outline"
          size={43}
          color={C.red}
        />
        <Text
          className="mt-4 text-center font-manrope-bold text-[18px]"
          style={{ color: C.text }}
        >
          No pudimos cargar tus datos
        </Text>
        <Text
          className="mt-2 text-center font-manrope text-[13px]"
          style={{ color: C.muted }}
        >
          {getQueryErrorMessage(error)}
        </Text>
        <Pressable
          onPress={() => void refetch()}
          accessibilityRole="button"
          className="mt-6 rounded-2xl px-6 py-3"
          style={{ backgroundColor: C.green }}
        >
          <Text className="font-manrope-bold text-[13px] text-[#071713]">
            Volver a intentar
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      edges={["top", "left", "right"]}
      style={{ backgroundColor: C.background }}
    >
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={C.background}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 2,
          paddingBottom: 110,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={C.green}
            colors={[C.green]}
            progressBackgroundColor={C.card}
          />
        }
      >
        {/* Saludo y acceso al perfil */}
        <View className="mb-6 flex-row items-center">
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityLabel="Abrir mi perfil"
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: C.avatar,
              borderWidth: 1,
              borderColor: C.avatarBorder,
            }}
          >
            <Text
              className="font-manrope-bold text-[21px]"
              style={{ color: C.green }}
            >
              {initial}
            </Text>
          </Pressable>
          <View className="ml-3 flex-1">
            <Text
              className="font-manrope-bold text-[19px]"
              style={{ color: C.text }}
              numberOfLines={1}
            >
              Hola, {displayName} 👋
            </Text>
            <Text
              className="mt-0.5 font-manrope text-[12px]"
              style={{ color: C.muted }}
            >
              Que tengas un gran día
            </Text>
          </View>
          <Pressable
            onPress={() => void refetch()}
            accessibilityLabel="Actualizar saldos y movimientos"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <MaterialCommunityIcons name="refresh" size={22} color={C.muted} />
          </Pressable>
        </View>

        {/* Tarjeta principal del saldo, con ondas decorativas */}
        <View
          className="mb-4 overflow-hidden rounded-[24px]"
          style={{
            borderWidth: 1,
            borderColor: isDark ? "#24694D" : "#B1E4CE",
          }}
        >
          <LinearGradient
            colors={
              isDark
                ? ["#132E2B", "#10231F", "#0D1A1B"]
                : ["#DDF7E9", "#E8FBF0", "#F5FFF9"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              minHeight: 80,
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
            <Svg
              pointerEvents="none"
              viewBox="0 0 360 160"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                width: "100%",
                height: "92%",
                opacity: 0.7,
              }}
            >
              <Path
                d="M0 154 C45 144 63 157 112 127 C152 103 184 128 222 102 C277 65 305 48 360 68"
                fill="none"
                stroke={isDark ? "#1C896B" : "#78CBAA"}
                strokeWidth={1.3}
              />
              <Path
                d="M0 160 C52 149 76 157 127 139 C183 115 207 140 263 113 C302 93 332 104 360 110"
                fill="none"
                stroke={isDark ? "#1B6757" : "#9FDAC0"}
                strokeWidth={1.1}
              />
              <Path
                d="M0 160 C95 149 120 154 172 137 C242 112 297 106 360 119 L360 160 Z"
                fill={isDark ? "#0E5849" : "#8CD8B6"}
                opacity={0.2}
              />
            </Svg>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text
                  className="font-manrope-medium text-[13px]"
                  style={{ color: C.balanceLabel }}
                >
                  Saldo total
                </Text>
                <Pressable
                  onPress={() => setShowBalance((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showBalance ? "Ocultar saldo" : "Mostrar saldo"
                  }
                  hitSlop={10}
                  className="ml-3"
                >
                  <MaterialCommunityIcons
                    name={showBalance ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={C.balanceIcon}
                  />
                </Pressable>
              </View>
              <Pressable
                onPress={() => router.push("/(tabs)/account")}
                accessibilityRole="button"
                accessibilityLabel="Consultar mis cuentas"
                hitSlop={9}
              >
                <MaterialCommunityIcons
                  name="dots-horizontal"
                  size={22}
                  color={C.balanceIcon}
                />
              </Pressable>
            </View>
            <Text
              className="font-manrope-bold tracking-tight"
              style={{
                color: C.balanceText,
                fontSize: width < 360 ? 30 : 35,
                fontVariant: ["tabular-nums"],
              }}
              adjustsFontSizeToFit
              numberOfLines={1}
            >
              {formatBalance}
            </Text>
          </LinearGradient>
        </View>

        {/* Ingresos y gastos, en tarjetas separadas como el mockup */}
        <View className="mb-3 flex-row" style={{ gap: 5 }}>
          {/* Ingresos */}
          <View
            className="min-w-0 flex-1 flex-row items-center rounded-[21px] p-4"
            style={{
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.border,
              gap: 5,
            }}
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: C.chipGreen }}
            >
              <MaterialCommunityIcons
                name="arrow-down"
                size={22}
                color={C.green}
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className="font-manrope-medium text-[11px]"
                style={{ color: C.muted }}
              >
                Ingresos
              </Text>
              <Text
                className="mt-0.5 font-manrope-bold text-[15px]"
                style={{ color: C.green }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                +{money(income)}
              </Text>
              <Text
                className="mt-0.5 font-manrope text-[10px]"
                style={{ color: C.muted }}
              >
                Este mes
              </Text>
            </View>
          </View>

          {/* Gastos */}
          <View
            className="min-w-0 flex-1 flex-row items-center rounded-[21px] p-4"
            style={{
              backgroundColor: C.card,
              borderWidth: 1,
              borderColor: C.border,
              gap: 12,
            }}
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: C.chipRed }}
            >
              <MaterialCommunityIcons name="arrow-up" size={22} color={C.red} />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className="font-manrope-medium text-[11px]"
                style={{ color: C.muted }}
              >
                Gastos
              </Text>
              <Text
                className="mt-0.5 font-manrope-bold text-[15px]"
                style={{ color: C.red }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                −{money(Math.abs(expenses))}
              </Text>
              <Text
                className="mt-0.5 font-manrope text-[10px]"
                style={{ color: C.muted }}
              >
                Este mes
              </Text>
            </View>
          </View>
        </View>

        {error ? (
          <Pressable
            onPress={() => void refetch()}
            className="mb-4 flex-row items-center rounded-2xl px-4 py-3"
            style={{
              backgroundColor: C.errorBg,
              borderWidth: 1,
              borderColor: C.errorBorder,
            }}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={C.red}
            />
            <Text
              className="ml-2 flex-1 font-manrope text-[12px]"
              style={{ color: C.errorText }}
            >
              No se pudieron actualizar los datos. Toca para reintentar.
            </Text>
          </Pressable>
        ) : null}

        {/* Gastos por categoría */}
        <View
          className="mb-4 rounded-[22px] p-5"
          style={{
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <SectionTitle
            palette={C}
            title="Gastos por categoría"
            action="Ver todo"
            onPress={() => router.push("/(tabs)/stats")}
          />
          {categories.length === 0 ? (
            <View className="items-center py-5">
              <MaterialCommunityIcons
                name="chart-donut"
                size={30}
                color={C.muted}
              />
              <Text
                className="mt-3 text-center font-manrope text-[12px]"
                style={{ color: C.muted }}
              >
                Tus gastos aparecerán aquí cuando registres movimientos.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 17 }}>
              {categories.map((category, index) => {
                const color = safeColor(
                  category.color,
                  ["#FB6979", "#FFB46A", "#6AA9FA", "#B996FF", "#9AA7B7"][
                    index
                  ],
                );
                const pct =
                  expenses > 0
                    ? Math.max(
                        0,
                        Math.min(100, (category.total / expenses) * 100),
                      )
                    : 0;
                return (
                  <View
                    key={category.categoryId}
                    className="flex-row items-center"
                    style={{ gap: 12 }}
                  >
                    <View
                      className="h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${color}2B` }}
                    >
                      <MaterialCommunityIcons
                        name={toIconName(category.icon, "shape-outline")}
                        size={22}
                        color={color}
                      />
                    </View>
                    <View className="min-w-0 flex-1">
                      <View
                        className="mb-2 flex-row items-center justify-between"
                        style={{ gap: 7 }}
                      >
                        <Text
                          numberOfLines={1}
                          className="min-w-0 flex-1 font-manrope-medium text-[12px]"
                          style={{ color: C.text }}
                        >
                          {category.name}
                        </Text>
                        <Text
                          className="font-manrope-medium text-[12px]"
                          style={{ color: C.text }}
                        >
                          {money(category.total)}
                        </Text>
                      </View>
                      <View
                        className="h-[7px] overflow-hidden rounded-full"
                        style={{ backgroundColor: C.track }}
                      >
                        <View
                          className="h-full rounded-full"
                          style={{ backgroundColor: color, width: `${pct}%` }}
                        />
                      </View>
                      <Text
                        className="mt-1 text-right font-manrope text-[10px]"
                        style={{ color: C.muted }}
                      >
                        {pct.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Últimos movimientos reales de la API */}
        <View
          className="rounded-[22px] p-5"
          style={{
            backgroundColor: C.card,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <SectionTitle
            palette={C}
            title="Transacciones recientes"
            action="Ver todo"
            onPress={() => router.push("/(tabs)/movements")}
          />
          {transactions.length === 0 ? (
            <Pressable
              onPress={() => setModalVisible(true)}
              className="items-center py-6"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={32}
                color={C.muted}
              />
              <Text
                className="mt-2 text-center font-manrope text-[12px]"
                style={{ color: C.muted }}
              >
                Aún no tienes movimientos. Toca aquí para agregar uno.
              </Text>
            </Pressable>
          ) : (
            <View>
              {transactions.map((movement, index) => {
                const expense = movement.type === "EXPENSE";
                const incomeTx = movement.type === "INCOME";
                const color = safeColor(
                  movement.category?.color ?? null,
                  expense ? C.red : C.green,
                );
                const icon = toIconName(
                  movement.category?.icon,
                  expense ? "cart-outline" : "cash-plus",
                );
                const title =
                  movement.description?.trim() ||
                  movement.category?.name ||
                  (incomeTx ? "Ingreso" : expense ? "Gasto" : "Movimiento");
                return (
                  <Pressable
                    key={movement.id}
                    onPress={() => router.push("/(tabs)/movements")}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver movimiento ${title}`}
                    className="flex-row items-center py-3"
                    style={{
                      borderBottomWidth:
                        index === transactions.length - 1 ? 0 : 1,
                      borderBottomColor: C.separator,
                    }}
                  >
                    <View
                      className="h-11 w-11 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${color}2B` }}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={21}
                        color={color}
                      />
                    </View>
                    <View className="ml-3 min-w-0 flex-1">
                      <Text
                        numberOfLines={1}
                        className="font-manrope-medium text-[13px]"
                        style={{ color: C.text }}
                      >
                        {title}
                      </Text>
                      <Text
                        className="mt-1 font-manrope text-[10px]"
                        style={{ color: C.muted }}
                        numberOfLines={1}
                      >
                        {shortDate(movement.occurredAt)}
                        {movement.sourceAccount
                          ? ` · ${movement.sourceAccount.name}`
                          : ""}
                      </Text>
                    </View>
                    <Text
                      className="ml-1 font-manrope-bold text-[12px]"
                      style={{
                        color: expense ? C.red : incomeTx ? C.green : C.text,
                      }}
                      numberOfLines={1}
                    >
                      {expense ? "−" : incomeTx ? "+" : ""}
                      {money(movement.amount)}
                    </Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={19}
                      color={C.muted}
                    />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Acceso siempre disponible para registrar un gasto o ingreso */}
      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Agregar nuevo movimiento"
        className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: C.green,
          elevation: 8,
          shadowColor: C.green,
          shadowOpacity: 0.22,
          shadowOffset: { width: 0, height: 5 },
          shadowRadius: 10,
        }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={28}
          color={isDark ? "#06251A" : "#FFFFFF"}
        />
      </Pressable>

      <ModalCreateFinances
        modalVisible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}
