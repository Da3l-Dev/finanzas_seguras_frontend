import { useTelegramLink } from "@/hooks/useTelegramLink";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";

export function TelegramLinkCard() {
  const {
    status,
    loadingStatus,
    linking,
    unlinking,
    pendingUrl,
    generateLink,
    unlink,
    cancelPending,
  } = useTelegramLink();
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setError(null);
    try {
      const url = await generateLink();
      if (!url) return;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        throw new Error("No se pudo abrir Telegram. ¿Está instalado?");
      }
      await Linking.openURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al conectar");
    }
  };

  const handleUnlink = () => {
    Alert.alert("Desvincular Telegram", "¿Ya no quieres recibir mensajes?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Desvincular",
        style: "destructive",
        onPress: async () => {
          try {
            await unlink();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Error al desvincular");
          }
        },
      },
    ]);
  };

  if (loadingStatus) {
    return (
      <View className="rounded-2xl bg-white p-5 dark:bg-slate-800">
        <ActivityIndicator color="#0284c7" />
      </View>
    );
  }

  // ── Vinculado ─────────────────────────────
  if (status.linked) {
    return (
      <View className="rounded-2xl bg-white p-5 dark:bg-slate-800">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-sky-500">
            <SymbolView
              name={{ android: "send", web: "send" }}
              size={22}
              tintColor="#fff"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-manrope-bold text-[15px] text-slate-900 dark:text-white">
                Telegram vinculado
              </Text>
              <View className="h-2 w-2 rounded-full bg-emerald-500" />
            </View>
            <Text className="font-manrope text-[12px] text-slate-500">
              {status.username
                ? `@${status.username}`
                : (status.firstName ?? "")}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleUnlink}
          disabled={unlinking}
          className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-rose-200 py-3 dark:border-rose-900/40 ${
            unlinking ? "opacity-50" : ""
          }`}
        >
          {unlinking ? (
            <ActivityIndicator color="#e11d48" size="small" />
          ) : (
            <Text className="font-manrope-bold text-[13px] text-rose-600">
              Desvincular
            </Text>
          )}
        </Pressable>

        {error && (
          <Text className="mt-2 font-manrope text-[12px] text-rose-500">
            {error}
          </Text>
        )}
      </View>
    );
  }

  // ── Esperando confirmación ────────────────
  if (pendingUrl) {
    return (
      <View className="rounded-2xl bg-white p-5 dark:bg-slate-800">
        <View className="flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-sky-500">
            <SymbolView
              name={{ android: "send", web: "send" }}
              size={22}
              tintColor="#fff"
            />
          </View>
          <View className="flex-1">
            <Text className="font-manrope-bold text-[15px] text-slate-900 dark:text-white">
              Esperando confirmación
            </Text>
            <Text className="font-manrope text-[12px] text-slate-500">
              Presiona "Iniciar" en Telegram
            </Text>
          </View>
          <ActivityIndicator color="#0284c7" />
        </View>

        <Pressable
          onPress={() => Linking.openURL(pendingUrl)}
          className="mt-4 items-center rounded-xl bg-sky-500 py-3"
        >
          <Text className="font-manrope-bold text-[13px] text-white">
            Abrir Telegram de nuevo
          </Text>
        </Pressable>

        <Pressable onPress={cancelPending} className="mt-2 items-center py-2">
          <Text className="font-manrope text-[12px] text-slate-500">
            Cancelar
          </Text>
        </Pressable>

        {error && (
          <Text className="mt-2 font-manrope text-[12px] text-rose-500">
            {error}
          </Text>
        )}
      </View>
    );
  }

  // ── Sin vincular ──────────────────────────
  return (
    <View className="rounded-2xl bg-white p-5 dark:bg-slate-800">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-sky-500">
          <SymbolView
            name={{ android: "send", web: "send" }}
            size={22}
            tintColor="#fff"
          />
        </View>
        <View className="flex-1">
          <Text className="font-manrope-bold text-[15px] text-slate-900 dark:text-white">
            Vincular Telegram
          </Text>
          <Text className="font-manrope text-[12px] text-slate-500">
            Registra gastos y recibe avisos por chat
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleConnect}
        disabled={linking}
        className={`mt-4 flex-row items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 ${
          linking ? "opacity-50" : ""
        }`}
      >
        {linking ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text className="font-manrope-bold text-[13px] text-white">
            Conectar con Telegram
          </Text>
        )}
      </Pressable>

      {error && (
        <Text className="mt-2 font-manrope text-[12px] text-rose-500">
          {error}
        </Text>
      )}
    </View>
  );
}
