import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAllAccounts, type Account } from "@/hooks/queries/useAccounts";
import { useDeleteAccount, useRestoreAccount } from "@/hooks/mutations/useFinanceMutations";
import { confirmAccountDeletion } from "@/lib/deletionConfirm";
import { getQueryErrorMessage } from "@/lib/queryUtils";
import ModalNewAccount from "@/ui/components/modalNewAccount";

export default function ArchivedAccountsScreen() {
  const { data, isPending, error, refetch } = useAllAccounts();
  const restore = useRestoreAccount();
  const remove = useDeleteAccount();
  const [editing, setEditing] = useState<Account | null>(null);
  const archived = (data ?? []).filter((item) => !!item.archivedAt || !item.isActive);

  const restoreAccount = async (account: Account) => {
    try {
      await restore.mutateAsync(account.id);
      Alert.alert("Cuenta restaurada", `«${account.name}» vuelve a aparecer en tus cuentas.`);
    } catch (e) {
      Alert.alert("No se pudo restaurar", getQueryErrorMessage(e));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
        </Pressable>
        <Text className="ml-4 flex-1 font-manrope-bold text-[22px] text-slate-900 dark:text-white">Cuentas archivadas</Text>
      </View>
      <Text className="mx-5 mb-4 font-manrope text-[13px] text-slate-500">
        Aquí están las cuentas ocultadas en versiones anteriores. Puedes recuperarlas, editarlas o borrarlas definitivamente de PostgreSQL.
      </Text>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {isPending ? (
          <ActivityIndicator color="#10b981" />
        ) : error ? (
          <Pressable onPress={() => { void refetch(); }}>
            <Text className="font-manrope text-rose-500">{getQueryErrorMessage(error)} · Reintentar</Text>
          </Pressable>
        ) : archived.length === 0 ? (
          <Text className="mt-8 text-center font-manrope text-slate-500">No tienes cuentas archivadas.</Text>
        ) : archived.map((account) => (
          <View key={account.id} className="mb-3 rounded-2xl bg-white p-4 dark:bg-slate-900">
            <Text className="font-manrope-bold text-[16px] text-slate-900 dark:text-white">{account.name}</Text>
            <Text className="mt-1 font-manrope text-[12px] text-slate-500">{account.type} · Cuenta archivada</Text>
            <View className="mt-4 flex-row flex-wrap gap-2">
              <Pressable onPress={() => { void restoreAccount(account); }} disabled={restore.isPending}
                className="rounded-xl bg-emerald-50 px-3 py-3 dark:bg-emerald-950/30">
                <Text className="font-manrope-bold text-[12px] text-emerald-600">Restaurar</Text>
              </Pressable>
              <Pressable onPress={() => setEditing(account)} className="rounded-xl bg-slate-100 px-3 py-3 dark:bg-slate-800">
                <Text className="font-manrope-bold text-[12px] text-slate-700 dark:text-white">Editar</Text>
              </Pressable>
              <Pressable onPress={() => confirmAccountDeletion(account.name, remove.mutateAsync, account.id)} disabled={remove.isPending}
                className="rounded-xl bg-rose-50 px-3 py-3 dark:bg-rose-950/30">
                <Text className="font-manrope-bold text-[12px] text-rose-600">Eliminar definitivamente</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <ModalNewAccount visible={!!editing} editing={editing} onClose={() => setEditing(null)} />
    </SafeAreaView>
  );
}
