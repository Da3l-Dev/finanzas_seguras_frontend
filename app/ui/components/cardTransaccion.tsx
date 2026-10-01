import { Transaccion } from "@/app/data/types/transaccion";
import { SymbolView } from "expo-symbols";
import { Text, View } from "react-native";
type CardTransaccionProps = {
  dataCard: Transaccion;
};

export default function CardTransaccion({ dataCard }: CardTransaccionProps) {
  const esIngreso = dataCard.type === "Ingreso";

  return (
    <View className="mb-3 w-full flex-row items-center gap-3 bg-white p-4 dark:bg-[#172033]">
      {/* Ícono */}
      <View
        className="shrink-0 items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: 50,
          backgroundColor: esIngreso ? "#A2F5BE" : "#FFE4E6",
        }}
      >
        <SymbolView
          name={dataCard.icon}
          size={22}
          tintColor={esIngreso ? "#0D8C44" : "#F43F5E"}
        />
      </View>

      {/* Nombre y fecha: ocupa todo el espacio central */}
      <View className="flex-1">
        <Text className="font-manrope-semibold text-[16px] text-slate-900 dark:text-white">
          {dataCard.name}
        </Text>

        <Text className="mt-1 font-manrope text-[14px] text-slate-900 dark:text-white">
          {dataCard.date}
        </Text>
      </View>

      {/* Monto */}
      <View className="shrink-0 items-end">
        <Text
          className={`font-manrope-bold text-[16px] ${
            esIngreso ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          {esIngreso ? "+" : "-"}${dataCard.amount.toLocaleString("es-MX")}
        </Text>

        <Text
          className={`font-manrope-bold text-[16px] ${
            esIngreso ? "text-emerald-500" : "text-rose-500"
          }`}
        >
          MXN
        </Text>
      </View>
    </View>
  );
}
