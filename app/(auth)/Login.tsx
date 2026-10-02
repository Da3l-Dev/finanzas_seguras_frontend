import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Llena todos los campos");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const deshabilitado = loading || !email.trim() || !password;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0f172a]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Logo / marca */}
          <View className="mb-12 items-center">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500">
              <SymbolView
                name={{ android: "savings", web: "savings" }}
                size={32}
                tintColor="#fff"
              />
            </View>
            <Text className="mt-4 font-manrope-bold text-[28px] text-slate-900 dark:text-white">
              Bienvenido
            </Text>
            <Text className="mt-1 font-manrope text-[14px] text-slate-500">
              Inicia sesión para continuar
            </Text>
          </View>

          {/* Campos */}
          <View className="gap-3">
            <View className="flex-row items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
              <SymbolView
                name={{ android: "mail", web: "mail" }}
                size={18}
                tintColor="#94a3b8"
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 font-manrope text-[15px] text-slate-900 dark:text-white"
              />
            </View>

            <View className="flex-row items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
              <SymbolView
                name={{ android: "lock", web: "lock" }}
                size={18}
                tintColor="#94a3b8"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry
                className="flex-1 font-manrope text-[15px] text-slate-900 dark:text-white"
              />
            </View>
          </View>

          {/* Error */}
          {error && (
            <Text className="mt-3 font-manrope text-[13px] text-rose-500">
              {error}
            </Text>
          )}

          {/* Botón */}
          <Pressable
            onPress={handleLogin}
            disabled={deshabilitado}
            className={`mt-6 items-center rounded-2xl bg-emerald-500 py-4 ${
              deshabilitado ? "opacity-40" : ""
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-manrope-bold text-[15px] text-white">
                Iniciar sesión
              </Text>
            )}
          </Pressable>

          {/* Link a registro */}
          <View className="mt-6 flex-row justify-center">
            <Text className="font-manrope text-[13px] text-slate-500">
              ¿No tienes cuenta?{" "}
            </Text>
            <Pressable onPress={() => router.push("/Register")}>
              <Text className="font-manrope-bold text-[13px] text-emerald-500">
                Regístrate
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
