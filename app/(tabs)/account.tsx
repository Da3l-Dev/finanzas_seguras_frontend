import type { CuentaTipo, SymbolName } from "@/app/data/types/cuentas";
import { SymbolView } from "expo-symbols";
import { useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ---------- Tipos ----------
type CuentaConSaldo = {
  id: string;
  name: string;
  type: CuentaTipo;
  icon: SymbolName;
  balance: number;
  creditLimit?: number;
};

// ---------- Datos mock ----------
const cuentasConSaldo: CuentaConSaldo[] = [
  {
    id: "a1",
    name: "Efectivo",
    type: "CASH",
    icon: { android: "payments", web: "payments" },
    balance: 2500,
  },
  {
    id: "a2",
    name: "Débito BBVA",
    type: "DEBIT_CARD",
    icon: { android: "credit_card", web: "credit_card" },
    balance: 8000,
  },
  {
    id: "a3",
    name: "Crédito Nu",
    type: "CREDIT_CARD",
    icon: { android: "credit_card", web: "credit_card" },
    balance: -1200,
    creditLimit: 5000,
  },
  {
    id: "a4",
    name: "Ahorro",
    type: "SAVINGS",
    icon: { android: "savings", web: "savings" },
    balance: 3200,
  },
];

// ---------- Paleta ----------
const COLORES = ["#10b981", "#3b82f6", "#f43f5e", "#f59e0b"];

// ---------- Helpers ----------
const formatMXN = (n: number) =>
  n.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const LABEL_TIPO: Record<CuentaTipo, string> = {
  CASH: "Efectivo",
  DEBIT_CARD: "Débito",
  CREDIT_CARD: "Crédito",
  SAVINGS: "Ahorro",
};

// ═══════════════════════════════════════════════════════════════
// Pantalla principal
// ═══════════════════════════════════════════════════════════════
export default function Accounts() {
  const stats = useMemo(() => {
    const totalAbs = cuentasConSaldo.reduce(
      (s, c) => s + Math.abs(c.balance),
      0,
    );
    const patrimonio = cuentasConSaldo
      .filter((c) => c.balance > 0)
      .reduce((s, c) => s + c.balance, 0);

    return {
      patrimonio,
      usoPorCuenta: cuentasConSaldo.map((c) => ({
        ...c,
        porcentaje: totalAbs > 0 ? (Math.abs(c.balance) / totalAbs) * 100 : 0,
      })),
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <Text className="font-manrope-bold text-[24px] text-slate-900 dark:text-white">
            Cuentas
          </Text>
          <Pressable
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-[#0f172a]"
          >
            <SymbolView
              name={{ android: "add", web: "add" }}
              size={18}
              tintColor="#10b981"
            />
          </Pressable>
        </View>

        {/* Patrimonio total */}
        <View className="mx-5 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <Text className="font-manrope-medium text-[14px] text-slate-500 dark:text-slate-400">
            Patrimonio total
          </Text>
          <View className="mt-1 flex-row items-baseline">
            <Text className="font-manrope-bold text-[20px] text-emerald-600">
              $
            </Text>
            <Text className="ml-1 font-manrope-bold text-[32px] text-slate-900 dark:text-white">
              {formatMXN(stats.patrimonio)}
            </Text>
          </View>
        </View>

        {/* Uso por cuenta: barra apilada + leyenda */}
        <View className="mx-5 mt-4 rounded-3xl bg-white p-5 dark:bg-[#0f172a]">
          <Text className="mb-3 font-manrope-medium text-[13px] text-slate-500 dark:text-slate-400">
            Uso por cuenta
          </Text>

          {/* Barra apilada simple */}
          <View className="h-2 w-full flex-row overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            {stats.usoPorCuenta.map((c, i) => (
              <View
                key={c.id}
                style={{
                  width: `${c.porcentaje}%`,
                  backgroundColor: COLORES[i % COLORES.length],
                }}
                className="h-full"
              />
            ))}
          </View>

          {/* Leyenda */}
          <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
            {stats.usoPorCuenta.map((c, i) => (
              <View key={c.id} className="flex-row items-center gap-1.5">
                <View
                  style={{ backgroundColor: COLORES[i % COLORES.length] }}
                  className="h-2 w-2 rounded-full"
                />
                <Text className="font-manrope text-[12px] text-slate-600 dark:text-slate-300">
                  {c.name}{" "}
                  <Text className="text-slate-400">
                    {c.porcentaje.toFixed(0)}%
                  </Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Lista de cuentas */}
        <View className="mx-5 mt-4 gap-3">
          {stats.usoPorCuenta.map((cuenta, i) => {
            const esDeuda = cuenta.balance < 0;
            const esCredito = cuenta.type === "CREDIT_CARD";
            const usoCredito =
              esCredito && cuenta.creditLimit
                ? (Math.abs(cuenta.balance) / cuenta.creditLimit) * 100
                : null;

            const color = esDeuda ? "#f43f5e" : COLORES[i % COLORES.length];

            return (
              <Pressable
                key={cuenta.id}
                className="rounded-3xl bg-white p-4 dark:bg-[#0f172a]"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{ backgroundColor: `${color}15` }}
                      className="h-10 w-10 items-center justify-center rounded-full"
                    >
                      <SymbolView
                        name={cuenta.icon}
                        size={18}
                        tintColor={color}
                      />
                    </View>
                    <View>
                      <Text className="font-manrope-bold text-[15px] text-slate-900 dark:text-white">
                        {cuenta.name}
                      </Text>
                      <Text className="font-manrope text-[11px] text-slate-400">
                        {LABEL_TIPO[cuenta.type]}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text
                      className={`font-manrope-bold text-[16px] ${
                        esDeuda
                          ? "text-rose-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {esDeuda ? "-" : ""}${formatMXN(Math.abs(cuenta.balance))}
                    </Text>
                    {esCredito && usoCredito !== null && (
                      <Text className="font-manrope text-[11px] text-slate-400">
                        {usoCredito.toFixed(0)}% del límite
                      </Text>
                    )}
                  </View>
                </View>

                {/* Mini barra simple */}
                <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <View
                    style={{
                      width: `${cuenta.porcentaje}%`,
                      backgroundColor: color,
                    }}
                    className="h-full"
                  />
                </View>

                {/* Alerta de crédito */}
                {esCredito && usoCredito !== null && usoCredito > 50 && (
                  <View className="mt-3 flex-row items-center gap-1.5 rounded-2xl bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                    <SymbolView
                      name={{ android: "warning", web: "warning" }}
                      size={14}
                      tintColor="#e11d48"
                    />
                    <Text className="font-manrope-medium text-[11px] text-rose-600 dark:text-rose-400">
                      Has usado más del 50% de tu crédito
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
