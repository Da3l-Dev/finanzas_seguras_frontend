import { TelegramLinkCard } from "@/ui/components/TelegramLinkCard";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TelegramSettings() {
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <SymbolView
            name={{ android: "arrow_back", web: "arrow_back" }}
            size={22}
            tintColor="#0f172a"
          />
        </Pressable>
        <Text className="font-manrope-bold text-[18px] text-slate-900 dark:text-white">
          Telegram
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-sky-500">
            <SymbolView
              name={{ android: "send", web: "send" }}
              size={32}
              tintColor="#fff"
            />
          </View>
          <Text className="mt-3 text-center font-manrope-bold text-[16px] text-slate-900 dark:text-white">
            Controla tus finanzas desde el chat
          </Text>
          <Text className="mt-1 text-center font-manrope text-[13px] text-slate-500">
            Registra gastos, consulta saldos y recibe alertas sin abrir la app.
          </Text>
        </View>

        <TelegramLinkCard />

        <View className="rounded-2xl bg-white p-5 dark:bg-slate-800">
          <Text className="font-manrope-bold text-[13px] text-slate-900 dark:text-white">
            ¿Qué puedes hacer?
          </Text>
          {[
            "«Gasté 150 en comida» y se registra solo",
            "Pregunta cuánto llevas gastado esta semana",
            "Recibe avisos cuando te pases del presupuesto",
            "Consulta el saldo de tus cuentas",
          ].map((t, i) => (
            <View key={i} className="mt-2 flex-row items-start gap-2">
              <Text className="text-emerald-500">•</Text>
              <Text className="flex-1 font-manrope text-[12px] text-slate-600 dark:text-slate-400">
                {t}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
