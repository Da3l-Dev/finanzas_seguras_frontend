import type { SymbolName } from "@/app/data/types/categorias";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════
type Periodo = "HOY" | "SEMANA" | "MES" | "AÑO";

type CategoriaStat = {
  nombre: string;
  icon: SymbolName;
  total: number;
};

type BarraTemporal = {
  label: string;
  monto: number;
  esActual?: boolean; // resaltar el día/semana actual
};

type StatPeriodo = {
  totalGastado: number;
  totalIngresado: number;
  cambioPorcentaje: number;
  promedioDiario: number;
  gastoMasAlto: { monto: number; descripcion: string };
  numTransacciones: number;
  categorias: CategoriaStat[];
  barras: BarraTemporal[];
};

// ═══════════════════════════════════════════════════════════════
// DATOS MOCK
// ═══════════════════════════════════════════════════════════════
const STATS: Record<Periodo, StatPeriodo> = {
  HOY: {
    totalGastado: 480,
    totalIngresado: 0,
    cambioPorcentaje: 8,
    promedioDiario: 480,
    gastoMasAlto: { monto: 280, descripcion: "Comida" },
    numTransacciones: 3,
    categorias: [
      {
        nombre: "Comida",
        icon: { android: "restaurant", web: "restaurant" },
        total: 280,
      },
      {
        nombre: "Gasolina",
        icon: { android: "local_gas_station", web: "local_gas_station" },
        total: 200,
      },
    ],
    barras: [
      { label: "6am", monto: 0 },
      { label: "9am", monto: 80 },
      { label: "12pm", monto: 200, esActual: true },
      { label: "3pm", monto: 0 },
      { label: "6pm", monto: 200 },
      { label: "9pm", monto: 0 },
    ],
  },
  SEMANA: {
    totalGastado: 1450,
    totalIngresado: 8500,
    cambioPorcentaje: -5,
    promedioDiario: 207,
    gastoMasAlto: { monto: 400, descripcion: "Gasolina" },
    numTransacciones: 12,
    categorias: [
      {
        nombre: "Comida",
        icon: { android: "restaurant", web: "restaurant" },
        total: 480,
      },
      {
        nombre: "Gasolina",
        icon: { android: "local_gas_station", web: "local_gas_station" },
        total: 400,
      },
      {
        nombre: "Súper",
        icon: { android: "shopping_cart", web: "shopping_cart" },
        total: 350,
      },
      { nombre: "Ocio", icon: { android: "movie", web: "movie" }, total: 220 },
    ],
    barras: [
      { label: "L", monto: 120 },
      { label: "M", monto: 280 },
      { label: "X", monto: 180 },
      { label: "J", monto: 320, esActual: true },
      { label: "V", monto: 250 },
      { label: "S", monto: 220 },
      { label: "D", monto: 80 },
    ],
  },
  MES: {
    totalGastado: 3200,
    totalIngresado: 11650,
    cambioPorcentaje: 12,
    promedioDiario: 107,
    gastoMasAlto: { monto: 850, descripcion: "Comida" },
    numTransacciones: 42,
    categorias: [
      {
        nombre: "Comida",
        icon: { android: "restaurant", web: "restaurant" },
        total: 850,
      },
      {
        nombre: "Gasolina",
        icon: { android: "local_gas_station", web: "local_gas_station" },
        total: 620,
      },
      {
        nombre: "Súper",
        icon: { android: "shopping_cart", web: "shopping_cart" },
        total: 480,
      },
      { nombre: "Casa", icon: { android: "home", web: "home" }, total: 350 },
      { nombre: "Ocio", icon: { android: "movie", web: "movie" }, total: 200 },
      {
        nombre: "Salud",
        icon: { android: "medical_services", web: "medical_services" },
        total: 150,
      },
    ],
    barras: [
      { label: "S1", monto: 850 },
      { label: "S2", monto: 720 },
      { label: "S3", monto: 950, esActual: true },
      { label: "S4", monto: 680 },
    ],
  },
  AÑO: {
    totalGastado: 38500,
    totalIngresado: 132000,
    cambioPorcentaje: -3,
    promedioDiario: 105,
    gastoMasAlto: { monto: 3500, descripcion: "Casa" },
    numTransacciones: 480,
    categorias: [
      {
        nombre: "Comida",
        icon: { android: "restaurant", web: "restaurant" },
        total: 9800,
      },
      { nombre: "Casa", icon: { android: "home", web: "home" }, total: 8400 },
      {
        nombre: "Gasolina",
        icon: { android: "local_gas_station", web: "local_gas_station" },
        total: 6200,
      },
      {
        nombre: "Súper",
        icon: { android: "shopping_cart", web: "shopping_cart" },
        total: 5400,
      },
      { nombre: "Ocio", icon: { android: "movie", web: "movie" }, total: 3200 },
      {
        nombre: "Salud",
        icon: { android: "medical_services", web: "medical_services" },
        total: 2500,
      },
    ],
    barras: [
      { label: "E", monto: 2800 },
      { label: "F", monto: 3100 },
      { label: "M", monto: 3400 },
      { label: "A", monto: 2900 },
      { label: "M", monto: 3200 },
      { label: "J", monto: 3600 },
      { label: "J", monto: 3300 },
      { label: "A", monto: 3100 },
      { label: "S", monto: 3400 },
      { label: "O", monto: 3200, esActual: true },
      { label: "N", monto: 3000 },
      { label: "D", monto: 3500 },
    ],
  },
};

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: "HOY", label: "Hoy" },
  { value: "SEMANA", label: "Semana" },
  { value: "MES", label: "Mes" },
  { value: "AÑO", label: "Año" },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
const formatMXN = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const COLORES = [
  "#10b981",
  "#3b82f6",
  "#f43f5e",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
];

// ═══════════════════════════════════════════════════════════════
// PANTALLA
// ═══════════════════════════════════════════════════════════════
export default function Stats() {
  const [periodo, setPeriodo] = useState<Periodo>("MES");
  const stat = STATS[periodo];

  const { maxCategoria, maxBarra, totalCategorias } = useMemo(() => {
    const maxCat = Math.max(...stat.categorias.map((c) => c.total), 1);
    const maxBar = Math.max(...stat.barras.map((b) => b.monto), 1);
    const total = stat.categorias.reduce((s, c) => s + c.total, 0);
    return { maxCategoria: maxCat, maxBarra: maxBar, totalCategorias: total };
  }, [stat]);

  const cambioPositivo = stat.cambioPorcentaje >= 0;

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
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

        {/* ────────── RESUMEN ────────── */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <Text className="font-manrope-medium text-[13px] text-slate-500 dark:text-slate-400">
            Gastaste {labelPeriodo(periodo)}
          </Text>
          <Text className="mt-1 font-manrope-bold text-[32px] text-rose-500">
            -${formatMXN(stat.totalGastado)}
          </Text>

          <View className="mt-3 flex-row items-center gap-2">
            <View
              className={`flex-row items-center gap-1 rounded-full px-2 py-1 ${
                cambioPositivo
                  ? "bg-rose-50 dark:bg-rose-950/30"
                  : "bg-emerald-50 dark:bg-emerald-950/30"
              }`}
            >
              <SymbolView
                name={{
                  android: cambioPositivo ? "trending_up" : "trending_down",
                  web: cambioPositivo ? "trending_up" : "trending_down",
                }}
                size={12}
                tintColor={cambioPositivo ? "#e11d48" : "#10b981"}
              />
              <Text
                className={`font-manrope-bold text-[11px] ${
                  cambioPositivo
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {cambioPositivo ? "+" : ""}
                {stat.cambioPorcentaje}%
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
              +${formatMXN(stat.totalIngresado)}
            </Text>
          </View>
        </View>

        {/* ────────── 3 MÉTRICAS RÁPIDAS ────────── */}
        <View className="mx-5 mt-3 flex-row gap-3">
          <MetricCard
            label="Promedio diario"
            value={`$${formatMXN(stat.promedioDiario)}`}
            icon={{ android: "calendar_today", web: "calendar_today" }}
            color="#3b82f6"
          />
          <MetricCard
            label="Gasto más alto"
            value={`$${formatMXN(stat.gastoMasAlto.monto)}`}
            subtitle={stat.gastoMasAlto.descripcion}
            icon={{ android: "trending_up", web: "trending_up" }}
            color="#f43f5e"
          />
          <MetricCard
            label="Movimientos"
            value={String(stat.numTransacciones)}
            icon={{ android: "receipt_long", web: "receipt_long" }}
            color="#8b5cf6"
          />
        </View>

        {/* ────────── GRÁFICA TEMPORAL ────────── */}
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
                bottom: 24 + Math.min(stat.promedioDiario / maxBarra, 1) * 80,
              }}
            >
              <View className="h-[1px] w-full bg-slate-200 dark:bg-slate-700" />
            </View>

            {stat.barras.map((b, i) => {
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

        {/* ────────── TOP CATEGORÍAS ────────── */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <Text className="mb-1 font-manrope-bold text-[14px] text-slate-900 dark:text-white">
            ¿En qué gastaste más?
          </Text>
          <Text className="mb-4 font-manrope text-[11px] text-slate-400">
            {stat.categorias.length} categorías · ${formatMXN(totalCategorias)}
          </Text>

          <View className="gap-4">
            {stat.categorias.map((cat, i) => {
              const pct = (cat.total / maxCategoria) * 100;
              const pctDelTotal = (cat.total / totalCategorias) * 100;
              const color = COLORES[i % COLORES.length];
              return (
                <View key={cat.nombre}>
                  <View className="mb-2 flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <View
                        style={{ backgroundColor: `${color}15` }}
                        className="h-7 w-7 items-center justify-center rounded-full"
                      >
                        <SymbolView
                          name={cat.icon}
                          size={14}
                          tintColor={color}
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

        {/* ────────── DISTRIBUCIÓN ────────── */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <Text className="mb-4 font-manrope-bold text-[14px] text-slate-900 dark:text-white">
            Distribución del gasto
          </Text>

          {/* Barra apilada */}
          <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {stat.categorias.map((cat, i) => (
              <View
                key={cat.nombre}
                style={{
                  width: `${(cat.total / totalCategorias) * 100}%`,
                  backgroundColor: COLORES[i % COLORES.length],
                }}
                className="h-full"
              />
            ))}
          </View>

          {/* Leyenda compacta */}
          <View className="mt-4 flex-row flex-wrap gap-x-4 gap-y-2">
            {stat.categorias.map((cat, i) => (
              <View key={cat.nombre} className="flex-row items-center gap-1.5">
                <View
                  style={{ backgroundColor: COLORES[i % COLORES.length] }}
                  className="h-2 w-2 rounded-full"
                />
                <Text className="font-manrope text-[11px] text-slate-600 dark:text-slate-300">
                  {cat.nombre}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUBCOMPONENTES
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
  icon: SymbolName;
  color: string;
}) {
  return (
    <View className="flex-1 rounded-2xl bg-white p-3 dark:bg-[#0f172a]">
      <View
        style={{ backgroundColor: `${color}15` }}
        className="mb-2 h-7 w-7 items-center justify-center rounded-full"
      >
        <SymbolView name={icon} size={14} tintColor={color} />
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

// ═══════════════════════════════════════════════════════════════
// HELPERS DE TEXTO
// ═══════════════════════════════════════════════════════════════
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
