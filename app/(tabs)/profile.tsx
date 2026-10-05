import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert("Cerrar sesión", "¿Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await signOut();
            router.replace("/(auth)/Login");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text className="font-manrope-bold text-[20px] text-slate-900 dark:text-white">
          Perfil
        </Text>

        <View className="rounded-2xl bg-white p-5 dark:bg-slate-800">
          <View className="flex-row items-center gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-500">
              <Text className="font-manrope-bold text-[20px] text-white">
                {user?.firstName?.[0]?.toUpperCase() ?? "?"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-manrope-bold text-[16px] text-slate-900 dark:text-white">
                {user?.displayName || user?.firstName || "Usuario"}
              </Text>
              <Text className="font-manrope text-[13px] text-slate-500">
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        <View className="overflow-hidden rounded-2xl bg-white dark:bg-slate-800">
          <Pressable
            onPress={() => router.push("/settings/telegram")}
            className="flex-row items-center justify-between px-5 py-4"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-sky-500">
                <SymbolView
                  name={{ android: "send", web: "send" }}
                  size={18}
                  tintColor="#fff"
                />
              </View>
              <Text className="font-manrope-bold text-[14px] text-slate-900 dark:text-white">
                Telegram
              </Text>
            </View>
            <SymbolView
              name={{ android: "chevron_right", web: "chevron_right" }}
              size={18}
              tintColor="#94a3b8"
            />
          </Pressable>
        </View>

        <Pressable
          onPress={handleSignOut}
          disabled={loading}
          className={`flex-row items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 py-4 dark:border-rose-900/40 dark:bg-rose-950/30 ${
            loading ? "opacity-50" : ""
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#e11d48" />
          ) : (
            <>
              <SymbolView
                name={{ android: "logout", web: "logout" }}
                size={18}
                tintColor="#e11d48"
              />
              <Text className="font-manrope-bold text-[15px] text-rose-600">
                Cerrar sesión
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
