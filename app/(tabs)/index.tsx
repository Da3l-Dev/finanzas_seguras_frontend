import { SymbolView } from "expo-symbols";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CardTransaccion from "../ui/components/cardTransaccion";

export default function Inicio() {
  const name = "Usuario";
  const transaccionData = [
    {
      id: "1",
      icon: {
        android: "work",
        web: "work",
      } as const,
      name: "Nómina",
      type: "Ingreso" as const,
      amount: 1000,
      date: "12 feb 2026",
    },
    {
      id: "2",
      icon: {
        android: "local_gas_station",
        web: "local_gas_station",
      } as const,
      name: "Gasolina",
      type: "Egreso" as const,
      amount: 500,
      date: "16 feb 2026",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f7f4f4] dark:bg-[#141313]">
      {/* Header bienvenida */}
      <View className="flex-row items-center  px-5 py-4">
        <View className="h-10 w-10  items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
          <SymbolView
            name={{
              android: "person",
              web: "person",
            }}
            size={20}
            tintColor="#ffffff"
          />
        </View>
        <Text className="font-manrope-bold left-2 text-[20px] text-slate-900 dark:text-white">
          Hola, {name}!
        </Text>
      </View>
      {/* Saldo disponible */}
      <View className="mx-5 rounded-3xl bg-[#fff] p-5 dark:bg-[#0f172a]">
        <Text className="font-manrope-medium text-[16px] text-slate-700 dark:text-slate-300">
          Saldo disponible
        </Text>

        <Text className="mt-2 font-manrope-bold text-[32px] text-slate-900 dark:text-white">
          $12,500.00
        </Text>
      </View>
      {/* Ingreso y gasto mensual */}
      <View className="mx-5 my-4 rounded-[10px] px-4 py-2 bg-[#fff] dark:bg-[#0f172a]">
        <View className="flex-row items-center">
          <View className="w-1/2 items-center  p-2">
            <Text className="font-manrope text-[12px] text-slate-900 dark:text-slate-300">
              Ingreso mensual
            </Text>

            <Text className="mt-1 font-manrope-bold text-[20px] text-emerald-500">
              +$8,000
            </Text>
          </View>
          <View className="h-full w-[2px] bg-slate-200 dark:bg-slate-700" />
          <View className="w-1/2 items-center  p-2">
            <Text className="font-manrope text-[12px] text-slate-900 dark:text-slate-300">
              Gasto mensual
            </Text>

            <Text className="mt-1 font-manrope-bold text-[20px] text-rose-500">
              -$3,200
            </Text>
          </View>
        </View>
      </View>
      {/* // Ultimos movimientos */}
      <View className="w-full px-5">
        <Text className="font-manrope-bold text-[16px] text-slate-900 dark:text-[#fff]">
          Movimientos Recientes
        </Text>
      </View>
      <View className="flex-1 rounded-[10px] mx-5 my-4 bg-[#fff] dark:bg-[#0f172a]">
        {transaccionData.map((transaccion) => (
          <CardTransaccion key={transaccion.id} dataCard={transaccion} />
        ))}
      </View>

      {/* Botón flotante para agregar un movimiento */}
      <Pressable
        className="absolute bottom-5 right-5 z-10 h-14 w-14 items-center justify-center rounded-full bg-emerald-500"
        onPress={() => {
          console.log("Agregar movimiento");
        }}
      >
        <Text className="font-manrope text-[32px] leading-none text-white">
          +
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
