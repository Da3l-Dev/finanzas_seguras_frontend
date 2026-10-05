import { useTelegramLink } from "@/hooks/useTelegramLink";
import { TelegramLinkCard } from "@/ui/components/TelegramLinkCard";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingTelegram() {
  const { status, generateLink, pendingUrl, loadingStatus } = useTelegramLink();
  const triedAutoOpen = useRef(false);

  // Auto-abrir UNA sola vez, cuando ya sepamos el estado
  useEffect(() => {
    if (loadingStatus || status.linked || triedAutoOpen.current) return;
    triedAutoOpen.current = true;

    (async () => {
      try {
        const url = await generateLink();
        if (!url) return;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) await Linking.openURL(url);
      } catch {
        // silencioso: el usuario tiene el card con botón manual
      }
    })();
  }, [loadingStatus, status.linked, generateLink]);

  // Redirigir al completar
  useEffect(() => {
    if (status.linked) {
      const t = setTimeout(() => router.replace("/(tabs)"), 1200);
      return () => clearTimeout(t);
    }
  }, [status.linked]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
        <View className="mt-6 items-center">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-sky-500">
            <SymbolView
              name={{ android: "send", web: "send" }}
              size={32}
              tintColor="#fff"
            />
          </View>
          <Text className="mt-4 text-center font-manrope-bold text-[22px] text-slate-900 dark:text-white">
            Te llevamos a Telegram
          </Text>
          <Text className="mt-2 text-center font-manrope text-[14px] text-slate-500">
            Presiona <Text className="font-manrope-bold">Iniciar</Text> en el
            chat del bot. Nosotros detectamos cuando termines.
          </Text>
        </View>

        <TelegramLinkCard />

        <Pressable
          onPress={() => router.replace("/(tabs)")}
          className="items-center py-4"
        >
          <Text className="font-manrope text-[13px] text-slate-500">
            Saltar por ahora
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
