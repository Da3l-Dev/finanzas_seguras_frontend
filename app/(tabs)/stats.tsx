import { useAuth } from "@/context/AuthContext";
import { useStats } from "@/hooks/queries/useDashboard";
import { toIconName } from "@/lib/icons";
import { getQueryErrorMessage } from "@/lib/queryUtils";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useMemo, useState } from "react";
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
type Periodo = "HOY" | "SEMANA" | "MES" | "AÑO";

type CategoriaStat = {
  categoryId: string;
  nombre: string;
  icon: string | null;
  color: string | null;
  total: number;
  count: number;
};

type BarraTemporal = {
  label: string;
  monto: number;
  esActual?: boolean;
};

type StatsData = {
  period: Periodo;
  start: string;
  end: string;
  totalGastado: number;
  totalIngresado: number;
  cambioPorcentaje: number;
  promedioDiario: number;
  gastoMasAlto: { monto: number; descripcion: string };
  numTransacciones: number;
  categorias: CategoriaStat[];
  barras: BarraTemporal[];
};

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "HOY", label: "Hoy" },
  { value: "SEMANA", label: "Semana" },
  { value: "MES", label: "Mes" },
  { value: "AÑO", label: "Año" },
];

// Paleta amplia: hasta 16 categorías sin repetir
const COLORES = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#84cc16", // lime
  "#a855f7", // purple
  "#0ea5e9", // sky
  "#ef4444", // red
  "#22c55e", // green
  "#eab308", // yellow
  "#6366f1", // indigo
];

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
const formatMXN = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

function labelPeriodo(p: Periodo): string {
  switch (p) {
    case "HOY":
      return "hoy";
    case "SEMANA":
      return "esta semana";
    case "MES":
      return "este mes";
    case "AÑO":
      return "este año";
  }
}

function tituloGrafica(p: Periodo): string {
  switch (p) {
    case "HOY":
      return "Gasto por hora";
    case "SEMANA":
      return "Gasto por día";
    case "MES":
      return "Gasto por semana";
    case "AÑO":
      return "Gasto por mes";
  }
}

/**
 * Asigna un color único a cada categoría.
 * - Respeta `cat.color` si no genera conflicto con otro ya usado.
 * - Si el color está repetido o no existe, toma el siguiente de la paleta no usado.
 * - Devuelve un Map<categoryId, color> consistente para toda la pantalla.
 */
function asignarColoresUnicos(
  categorias: CategoriaStat[],
): Map<string, string> {
  const mapa = new Map<string, string>();
  const usados = new Set<string>();
  let paletaIndex = 0;

  for (const cat of categorias) {
    const normalizado = cat.color?.toLowerCase().trim() ?? null;

    // 1) Si tiene color propio y no está repetido, lo respetamos
    if (normalizado && !usados.has(normalizado)) {
      mapa.set(cat.categoryId, cat.color!);
      usados.add(normalizado);
      continue;
    }

    // 2) Buscamos el siguiente color de la paleta que no esté en uso
    let asignado: string | null = null;
    for (let i = 0; i < COLORES.length; i++) {
      const candidato = COLORES[(paletaIndex + i) % COLORES.length];
      if (!usados.has(candidato.toLowerCase())) {
        asignado = candidato;
        paletaIndex = (paletaIndex + i + 1) % COLORES.length;
        break;
      }
    }

    // 3) Si ya se usaron todos (poco probable), ciclamos
    if (!asignado) {
      asignado = COLORES[paletaIndex % COLORES.length];
      paletaIndex++;
    }

    mapa.set(cat.categoryId, asignado);
    usados.add(asignado.toLowerCase());
  }

  return mapa;
}

// ═══════════════════════════════════════════════════════════════
// Pantalla
// ═══════════════════════════════════════════════════════════════
export default function Stats() {
  const { token, isLoading: authLoading } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>("MES");
  const {
    data,
    isPending: loading,
    isRefetching: refreshing,
    error: queryError,
    refetch,
  } = useStats(periodo);
  const error = queryError ? getQueryErrorMessage(queryError) : null;
  const cargar = (_periodo?: Periodo, _refresh?: boolean) => {
    void refetch();
  };

  // Mapa de colores únicos por categoría (consistente en toda la pantalla)
  const coloresCategorias = useMemo(
    () => asignarColoresUnicos(data?.categorias ?? []),
    [data?.categorias],
  );

  // ============ Loading inicial ============
  if (authLoading || (loading && !data)) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f7f4f4] dark:bg-[#141313]">
        <ActivityIndicator color="#10b981" />
        <Text className="mt-3 font-manrope text-[12px] text-slate-500">
          Cargando estadísticas…
        </Text>
      </SafeAreaView>
    );
  }

  // ============ Sin datos ============
  if (!data || (data.totalGastado === 0 && data.totalIngresado === 0)) {
    return (
      <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
        <View className="px-5 py-4">
          <Text className="font-manrope-bold text-[24px] text-slate-900 dark:text-white">
            Estadísticas
          </Text>
        </View>
        <View className="mx-5 flex-row rounded-2xl bg-white p-1 dark:bg-[#0f172a]">
          {PERIODOS.map((p) => {
            const activo = periodo === p.value;
            return (
              <Pressable
                key={p.value}
                onPress={() => setPeriodo(p.value)}
                className={`flex-1 items-center rounded-xl py-2.5 ${
                  activo ? "bg-slate-900 dark:bg-white" : ""
                }`}
              >
                <Text
                  className={`font-manrope-bold text-[13px] ${
                    activo
                      ? "text-white dark:text-slate-900"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="mx-5 mt-8 items-center rounded-3xl bg-white p-8 dark:bg-[#0f172a]">
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={40}
            color="#94a3b8"
          />
          <Text className="mt-4 font-manrope-bold text-[15px] text-slate-900 dark:text-white">
            Sin datos en este periodo
          </Text>
          <Text className="mt-1 text-center font-manrope text-[12px] text-slate-500">
            Registra movimientos para ver tus estadísticas aquí.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxCategoria = Math.max(...data.categorias.map((c) => c.total), 1);
  const totalCategorias = data.categorias.reduce((s, c) => s + c.total, 0);
  const maxBarra = Math.max(...data.barras.map((b) => b.monto), 1);
  const cambioPositivo = data.cambioPorcentaje >= 0;

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => cargar(periodo, true)}
            tintColor="#10b981"
          />
        }
      >
        {/* Header */}
        <View className="px-5 py-4">
          <Text className="font-manrope-bold text-[24px] text-slate-900 dark:text-white">
            Estadísticas
          </Text>
        </View>

        {/* Selector de periodo */}
        <View className="mx-5 flex-row rounded-2xl bg-white p-1 dark:bg-[#0f172a]">
          {PERIODOS.map((p) => {
            const activo = periodo === p.value;
            return (
              <Pressable
                key={p.value}
                onPress={() => setPeriodo(p.value)}
                className={`flex-1 items-center rounded-xl py-2.5 ${
                  activo ? "bg-slate-900 dark:bg-white" : ""
                }`}
              >
                <Text
                  className={`font-manrope-bold text-[13px] ${
                    activo
                      ? "text-white dark:text-slate-900"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Error */}
        {error && (
          <View className="mx-5 mt-3 flex-row items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
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

        {/* ── RESUMEN ── */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <Text className="font-manrope-medium text-[13px] text-slate-500 dark:text-slate-400">
            Gastaste {labelPeriodo(periodo)}
          </Text>
          <Text className="mt-1 font-manrope-bold text-[32px] text-rose-500">
            -${formatMXN(data.totalGastado)}
          </Text>

          <View className="mt-3 flex-row items-center gap-2">
            <View
              className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${
                cambioPositivo
                  ? "bg-rose-50 dark:bg-rose-950/30"
                  : "bg-emerald-50 dark:bg-emerald-950/30"
              }`}
            >
              <MaterialCommunityIcons
                name={cambioPositivo ? "trending-up" : "trending-down"}
                size={12}
                color={cambioPositivo ? "#e11d48" : "#10b981"}
              />
              <Text
                className={`font-manrope-bold text-[11px] ${
                  cambioPositivo
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {cambioPositivo ? "+" : ""}
                {data.cambioPorcentaje.toFixed(0)}%
              </Text>
            </View>
            <Text className="font-manrope text-[11px] text-slate-400">
              vs. periodo anterior
            </Text>
          </View>

          <View className="my-4 h-[1px] bg-slate-100 dark:bg-slate-800" />

          <View className="flex-row items-center justify-between">
            <Text className="font-manrope-medium text-[13px] text-slate-500 dark:text-slate-400">
              Ingresaste
            </Text>
            <Text className="font-manrope-bold text-[16px] text-emerald-500">
              +${formatMXN(data.totalIngresado)}
            </Text>
          </View>
        </View>

        {/* ── 3 MÉTRICAS ── */}
        <View className="mx-5 mt-3 flex-row gap-3">
          <MetricCard
            label="Promedio diario"
            value={`$${formatMXN(data.promedioDiario)}`}
            icon="calendar-today"
            color="#3b82f6"
          />
          <MetricCard
            label="Gasto más alto"
            value={
              data.gastoMasAlto.monto > 0
                ? `$${formatMXN(data.gastoMasAlto.monto)}`
                : "$0"
            }
            subtitle={data.gastoMasAlto.descripcion}
            icon="trending-up"
            color="#f43f5e"
          />
          <MetricCard
            label="Movimientos"
            value={String(data.numTransacciones)}
            icon="receipt"
            color="#8b5cf6"
          />
        </View>

        {/* ── GRÁFICA TEMPORAL ── */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-manrope-bold text-[14px] text-slate-900 dark:text-white">
              {tituloGrafica(periodo)}
            </Text>
            <View className="flex-row items-center gap-1">
              <View className="h-[2px] w-3 bg-slate-300" />
              <Text className="font-manrope text-[10px] text-slate-400">
                Promedio
              </Text>
            </View>
          </View>

          <View
            className="relative flex-row items-end justify-between"
            style={{ height: 110 }}
          >
            {/* Línea de promedio */}
            <View
              className="absolute left-0 right-0 z-10"
              style={{
                bottom: 24 + Math.min(data.promedioDiario / maxBarra, 1) * 80,
              }}
            >
              <View className="h-[1px] w-full bg-slate-200 dark:bg-slate-700" />
            </View>

            {data.barras.map((b, i) => {
              const pct = (b.monto / maxBarra) * 100;
              return (
                <View key={i} className="flex-1 items-center">
                  <View className="h-[80px] w-full items-end justify-end px-0.5">
                    {b.monto > 0 && (
                      <Text className="mb-1 font-manrope text-[9px] text-slate-500">
                        {formatMXN(b.monto)}
                      </Text>
                    )}
                    <View
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      className={`w-full rounded-t-md ${
                        b.monto === 0
                          ? "bg-slate-100 dark:bg-slate-800"
                          : b.esActual
                            ? "bg-emerald-600"
                            : "bg-emerald-400"
                      }`}
                    />
                  </View>
                  <Text
                    className={`mt-2 font-manrope text-[10px] ${
                      b.esActual
                        ? "font-manrope-bold text-emerald-600"
                        : "text-slate-400"
                    }`}
                    numberOfLines={1}
                  >
                    {b.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── TOP CATEGORÍAS ── */}
        {data.categorias.length > 0 && (
          <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
            <Text className="mb-1 font-manrope-bold text-[14px] text-slate-900 dark:text-white">
              ¿En qué gastaste más?
            </Text>
            <Text className="mb-4 font-manrope text-[11px] text-slate-400">
              {data.categorias.length}{" "}
              {data.categorias.length === 1 ? "categoría" : "categorías"} · $
              {formatMXN(totalCategorias)}
            </Text>

            <View className="gap-4">
              {data.categorias.map((cat, i) => {
                const pct = (cat.total / maxCategoria) * 100;
                const pctDelTotal =
                  totalCategorias > 0 ? (cat.total / totalCategorias) * 100 : 0;
                const color =
                  coloresCategorias.get(cat.categoryId) ??
                  COLORES[i % COLORES.length];
                return (
                  <View key={cat.categoryId}>
                    <View className="mb-2 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <View
                          style={{ backgroundColor: `${color}20` }}
                          className="h-7 w-7 items-center justify-center rounded-full"
                        >
                          <MaterialCommunityIcons
                            name={toIconName(cat.icon)}
                            size={14}
                            color={color}
                          />
                        </View>
                        <Text className="font-manrope-medium text-[13px] text-slate-700 dark:text-slate-200">
                          {cat.nombre}
                        </Text>
                      </View>
                      <View className="flex-row items-baseline gap-2">
                        <Text className="font-manrope text-[10px] text-slate-400">
                          {pctDelTotal.toFixed(0)}%
                        </Text>
                        <Text className="font-manrope-bold text-[13px] text-slate-900 dark:text-white">
                          ${formatMXN(cat.total)}
                        </Text>
                      </View>
                    </View>
                    <View className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <View
                        style={{ width: `${pct}%`, backgroundColor: color }}
                        className="h-full"
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── DISTRIBUCIÓN ── */}
        {data.categorias.length > 1 && (
          <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
            <Text className="mb-4 font-manrope-bold text-[14px] text-slate-900 dark:text-white">
              Distribución del gasto
            </Text>

            <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              {data.categorias.map((cat, i) => (
                <View
                  key={cat.categoryId}
                  style={{
                    width: `${(cat.total / totalCategorias) * 100}%`,
                    backgroundColor:
                      coloresCategorias.get(cat.categoryId) ??
                      COLORES[i % COLORES.length],
                  }}
                  className="h-full"
                />
              ))}
            </View>

            <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-2">
              {data.categorias.map((cat, i) => (
                <View
                  key={cat.categoryId}
                  className="flex-row items-center gap-1.5"
                >
                  <View
                    style={{
                      backgroundColor:
                        coloresCategorias.get(cat.categoryId) ??
                        COLORES[i % COLORES.length],
                    }}
                    className="h-2 w-2 rounded-full"
                  />
                  <Text className="font-manrope text-[11px] text-slate-600 dark:text-slate-300">
                    {cat.nombre}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// MetricCard
// ═══════════════════════════════════════════════════════════════
function MetricCard({
  label,
  value,
  subtitle,
  icon,
  color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-3 dark:bg-[#0f172a]">
      <View
        style={{ backgroundColor: `${color}20` }}
        className="mb-2 h-7 w-7 items-center justify-center rounded-full"
      >
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
      </View>
      <Text className="font-manrope text-[10px] text-slate-400">{label}</Text>
      <Text className="mt-0.5 font-manrope-bold text-[14px] text-slate-900 dark:text-white">
        {value}
      </Text>
      {subtitle && (
        <Text
          numberOfLines={1}
          className="font-manrope text-[9px] text-slate-400"
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}
