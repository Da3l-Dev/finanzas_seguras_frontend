import { useAuth } from "@/context/AuthContext";
import {
  formatPhone,
  validateEmail,
  validateFirstName,
  validateLastName,
  validatePassword,
  validatePhone,
} from "@/lib/validators";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SymbolName } from "../data/types/cuentas";

export default function Register() {
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Validaciones en tiempo real (solo si el campo tiene contenido)
  const errors = useMemo(
    () => ({
      email: email.length > 0 ? validateEmail(email) : null,
      phone: phone.length > 0 ? validatePhone(phone) : null,
      password: password.length > 0 ? validatePassword(password) : null,
      firstName: firstName.length > 0 ? validateFirstName(firstName) : null,
      lastName: lastName.length > 0 ? validateLastName(lastName) : null,
    }),
    [email, phone, password, firstName, lastName],
  );

  // ¿Todo listo para enviar?
  const formValido =
    !validateEmail(email) &&
    !validatePhone(phone) &&
    !validatePassword(password) &&
    !validateFirstName(firstName) &&
    !validateLastName(lastName);

  const handleRegister = async () => {
    if (!formValido || loading) return;
    setServerError(null);
    setLoading(true);

    try {
      await signUp({
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ""),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: displayName.trim() || firstName.trim(),
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      setServerError(e?.message ?? "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0f172a]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <View className="mb-8 mt-8 items-center px-6">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500">
              <SymbolView
                name={{ android: "person_add", web: "person_add" }}
                size={32}
                tintColor="#fff"
              />
            </View>
            <Text className="mt-4 font-manrope-bold text-[26px] text-slate-900 dark:text-white">
              Crear cuenta
            </Text>
            <Text className="mt-1 font-manrope text-[13px] text-slate-500">
              Empecemos con tus datos
            </Text>
          </View>

          {/* Formulario */}
          <View className="gap-3 px-6">
            <FieldInput
              icon={{ android: "mail", web: "mail" }}
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FieldInput
              icon={{ android: "phone", web: "phone" }}
              placeholder="771 444 1450"
              value={phone}
              onChangeText={(t) => setPhone(formatPhone(t))}
              error={errors.phone}
              keyboardType="phone-pad"
            />

            <FieldInput
              icon={{ android: "lock", web: "lock" }}
              placeholder="Contraseña"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              rightIcon={
                showPassword
                  ? { android: "visibility_off", web: "visibility_off" }
                  : { android: "visibility", web: "visibility" }
              }
              onRightPress={() => setShowPassword((v) => !v)}
            />

            {/* Hint de password */}
            {!errors.password && password.length > 0 && (
              <Text className="ml-1 font-manrope text-[11px] text-emerald-500">
                ✓ Contraseña segura
              </Text>
            )}

            <FieldInput
              icon={{ android: "badge", web: "badge" }}
              placeholder="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
            />

            <FieldInput
              icon={{ android: "badge", web: "badge" }}
              placeholder="Apellido"
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
            />

            <FieldInput
              icon={{ android: "alternate_email", web: "alternate_email" }}
              placeholder="Nombre visible (opcional)"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

          {/* Error del servidor */}
          {serverError && (
            <View className="mx-6 mt-4 flex-row items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
              <SymbolView
                name={{ android: "error", web: "error" }}
                size={16}
                tintColor="#e11d48"
              />
              <Text className="flex-1 font-manrope text-[12px] text-rose-600 dark:text-rose-400">
                {serverError}
              </Text>
            </View>
          )}

          {/* Botón */}
          <View className="mt-6 px-6">
            <Pressable
              onPress={handleRegister}
              disabled={!formValido || loading}
              className={`items-center rounded-2xl bg-emerald-500 py-4 ${
                !formValido || loading ? "opacity-40" : ""
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-manrope-bold text-[15px] text-white">
                  Crear cuenta
                </Text>
              )}
            </Pressable>
          </View>

          {/* Link a login */}
          <View className="mt-6 flex-row justify-center">
            <Text className="font-manrope text-[13px] text-slate-500">
              ¿Ya tienes cuenta?{" "}
            </Text>
            <Pressable onPress={() => router.replace("/Login")}>
              <Text className="font-manrope-bold text-[13px] text-emerald-500">
                Inicia sesión
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
// Input reutilizable con error inline
// ═══════════════════════════════════════════════════════════════
type FieldInputProps = {
  icon: SymbolName;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  rightIcon?: SymbolName;
  onRightPress?: () => void;
};

function FieldInput({
  icon,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  rightIcon,
  onRightPress,
}: FieldInputProps) {
  const hasError = !!error;

  return (
    <View>
      <View
        className={`flex-row items-center gap-3 rounded-2xl px-4 py-3.5 ${
          hasError
            ? "bg-rose-50 dark:bg-rose-950/30"
            : "bg-slate-100 dark:bg-slate-800"
        }`}
      >
        <SymbolView
          name={icon}
          size={18}
          tintColor={hasError ? "#e11d48" : "#94a3b8"}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          className="flex-1 font-manrope text-[15px] text-slate-900 dark:text-white"
        />
        {rightIcon && onRightPress && (
          <Pressable onPress={onRightPress} hitSlop={10}>
            <SymbolView name={rightIcon} size={18} tintColor="#94a3b8" />
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="ml-1 mt-1 font-manrope text-[11px] text-rose-500">
          {error}
        </Text>
      )}
    </View>
  );
}
