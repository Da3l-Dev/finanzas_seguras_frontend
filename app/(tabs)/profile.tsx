import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme, type ThemePreference } from "@/context/ThemeContext";
import { useProfile } from "@/hooks/queries/useProfile";
import { useChangePassword, useDeleteUser, useUpdateProfile } from "@/hooks/mutations/useFinanceMutations";
import { getFieldErrors, getQueryErrorMessage } from "@/lib/queryUtils";

function Field({ label, value, onChangeText, secureTextEntry = false, keyboardType = "default", error }: {
  label: string; value: string; onChangeText: (value: string) => void; secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address"; error?: string;
}) {
  return <View className="mb-3">
    <Text className="mb-1.5 font-manrope-bold text-[12px] text-slate-600 dark:text-slate-300">{label}</Text>
    <TextInput value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} autoCapitalize={keyboardType === "email-address" ? "none" : "sentences"} keyboardType={keyboardType} placeholderTextColor="#94a3b8" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-manrope text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
    {!!error && <Text className="mt-1 text-rose-500">{error}</Text>}
  </View>;
}
const Action = ({ title, onPress, disabled, destructive = false }: { title: string; onPress: () => void; disabled?: boolean; destructive?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} className={`items-center rounded-2xl py-3.5 ${destructive ? "border border-rose-200 bg-rose-50 dark:bg-rose-950/30" : "bg-emerald-500"}`}>
    <Text className={`font-manrope-bold ${destructive ? "text-rose-600" : "text-white"}`}>{disabled ? "Procesando…" : title}</Text>
  </Pressable>
);
export default function Profile() {
  const { user, updateLocalUser, signOut } = useAuth();
  const { preference, setPreference, resolvedTheme } = useAppTheme();
  const profile = useProfile();
  const save = useUpdateProfile();
  const passwordMutation = useChangePassword();
  const deleteMutation = useDeleteUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  useEffect(() => {
    if (!profile.data) return;
    setFirstName(profile.data.firstName ?? "");
    setLastName(profile.data.lastName ?? "");
    setDisplayName(profile.data.displayName ?? "");
    setEmail(profile.data.email ?? "");
  }, [profile.data]);
  const saveProfile = async () => {
    setFields({}); setError("");
    try {
      const updated = await save.mutateAsync({ firstName: firstName.trim(), lastName: lastName.trim(), displayName: displayName.trim(), email: email.trim() });
      await updateLocalUser(updated);
      Alert.alert("Perfil actualizado", "Tus datos se guardaron correctamente.");
    } catch (e) { setFields(getFieldErrors(e)); setError(getQueryErrorMessage(e)); }
  };
  const changePassword = async () => {
    setError(""); setFields({});
    try {
      await passwordMutation.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword("");
      Alert.alert("Contraseña actualizada", "Por seguridad debes iniciar sesión nuevamente.", [{ text: "Entendido", onPress: () => { void signOut().then(() => router.replace("/(auth)/Login")); } }]);
    } catch (e) { setFields(getFieldErrors(e)); setError(getQueryErrorMessage(e)); }
  };
  const logout = () => Alert.alert("Cerrar sesión", "¿Deseas salir?", [{ text: "Cancelar", style: "cancel" }, { text: "Salir", onPress: () => { void signOut().then(() => router.replace("/(auth)/Login")); } }]);
  const deleteUser = () => {
    if (!deletePassword) { setError("Escribe tu contraseña para confirmar."); return; }
    Alert.alert("Eliminar mi cuenta", "Tu acceso será desactivado y se cerrarán tus sesiones. Esta acción no puede deshacerse desde la aplicación.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Desactivar cuenta", style: "destructive", onPress: async () => {
        try { await deleteMutation.mutateAsync({ password: deletePassword }); await signOut(); router.replace("/(auth)/Login"); }
        catch (e) { setFields(getFieldErrors(e)); setError(getQueryErrorMessage(e)); }
      } },
    ]);
  };
  return <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
      <Text className="mb-4 font-manrope-bold text-[23px] text-slate-900 dark:text-white">Mi perfil</Text>
      <View className="mb-4 flex-row items-center rounded-2xl bg-white p-4 dark:bg-slate-900">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-emerald-500"><Text className="font-manrope-bold text-[23px] text-white">{user?.firstName?.[0]?.toUpperCase() ?? "?"}</Text></View>
        <View className="flex-1"><Text className="font-manrope-bold text-slate-900 dark:text-white">{profile.data?.displayName || profile.data?.firstName || "Usuario"}</Text><Text className="font-manrope text-[12px] text-slate-500">{profile.data?.email || user?.email}</Text></View>
        {profile.isFetching && <ActivityIndicator color="#10b981" />}
      </View>
      {/* Preferencia local: aplica a todas las pantallas y se conserva al reiniciar. */}
      <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <View className="mb-3 flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/40">
            <MaterialCommunityIcons name="theme-light-dark" color={resolvedTheme === "dark" ? "#3DE0A2" : "#059669"} size={23} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-manrope-bold text-[15px] text-slate-900 dark:text-white">Apariencia</Text>
            <Text className="font-manrope text-[11px] text-slate-500 dark:text-slate-400">Elige cómo quieres ver la aplicación</Text>
          </View>
        </View>
        <View className="flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800" style={{ gap: 5 }}>
          {([
            { value: "light", label: "Claro", icon: "white-balance-sunny" },
            { value: "dark", label: "Oscuro", icon: "weather-night" },
            { value: "system", label: "Auto", icon: "cellphone-cog" },
          ] as const).map((option) => {
            const selected = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={`Tema ${option.label}`}
                onPress={() => setPreference(option.value as ThemePreference)}
                className="min-w-0 flex-1 items-center justify-center rounded-xl px-1 py-3"
                style={{ backgroundColor: selected ? (resolvedTheme === "dark" ? "#145B45" : "#D9F8EA") : "transparent" }}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  size={19}
                  color={selected ? (resolvedTheme === "dark" ? "#5AEBB4" : "#047857") : (resolvedTheme === "dark" ? "#94A3B8" : "#64748B")}
                />
                <Text
                  className="mt-1 font-manrope-semibold text-[11px]"
                  style={{ color: selected ? (resolvedTheme === "dark" ? "#5AEBB4" : "#047857") : (resolvedTheme === "dark" ? "#CBD5E1" : "#475569") }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="mt-3 font-manrope text-[11px] text-slate-500 dark:text-slate-400">
          {preference === "system" ? "Automático utiliza el tema configurado en tu teléfono." : "Tu preferencia se conservará cuando vuelvas a abrir la aplicación."}
        </Text>
      </View>
      {!!error && <Text className="mb-3 rounded-xl bg-rose-50 p-3 text-rose-600 dark:bg-rose-950/30">{error}</Text>}
      <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-4 font-manrope-bold text-[17px] text-slate-900 dark:text-white">Datos personales</Text>
        <Field label="Nombre" value={firstName} onChangeText={setFirstName} error={fields.firstName} />
        <Field label="Apellidos" value={lastName} onChangeText={setLastName} error={fields.lastName} />
        <Field label="Nombre visible" value={displayName} onChangeText={setDisplayName} error={fields.displayName} />
        <Field label="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" error={fields.email} />
        <Action title="Guardar perfil" disabled={save.isPending} onPress={() => void saveProfile()} />
      </View>
      <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-4 font-manrope-bold text-[17px] text-slate-900 dark:text-white">Seguridad</Text>
        <Field label="Contraseña actual" value={currentPassword} secureTextEntry onChangeText={setCurrentPassword} error={fields.currentPassword} />
        <Field label="Nueva contraseña (mínimo 8 caracteres)" value={newPassword} secureTextEntry onChangeText={setNewPassword} error={fields.newPassword} />
        <Action title="Cambiar contraseña" disabled={passwordMutation.isPending || !currentPassword || newPassword.length < 8} onPress={() => void changePassword()} />
      </View>
      <View className="mb-4 overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
        {([ ["Telegram", "/settings/telegram", "send"], ["Categorías", "/categories", "shape-outline"], ["Metas y presupuestos", "/planning", "piggy-bank-outline"] ] as const).map(([label, route, icon]) => (
          <Pressable key={label} onPress={() => router.push(route)} className="flex-row items-center border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <MaterialCommunityIcons name={icon} color="#10b981" size={22} /><Text className="ml-3 flex-1 font-manrope-bold text-slate-900 dark:text-white">{label}</Text><MaterialCommunityIcons name="chevron-right" color="#94a3b8" size={20} />
          </Pressable>
        ))}
      </View>
      <Action title="Cerrar sesión" destructive onPress={logout} />
      <Pressable className="mt-5 items-center" onPress={() => setShowDelete(v => !v)}><Text className="font-manrope text-[12px] text-rose-500">{showDelete ? "Ocultar eliminación de cuenta" : "Eliminar mi cuenta"}</Text></Pressable>
      {showDelete && <View className="mt-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-3 font-manrope text-slate-500">La eliminación desactiva el acceso y conserva el historial según las reglas de retención.</Text>
        <Field label="Confirma tu contraseña" value={deletePassword} secureTextEntry onChangeText={setDeletePassword} error={fields.password} />
        <Action title="Desactivar mi cuenta" destructive disabled={deleteMutation.isPending} onPress={deleteUser} />
      </View>}
    </ScrollView>
  </SafeAreaView>;
}
