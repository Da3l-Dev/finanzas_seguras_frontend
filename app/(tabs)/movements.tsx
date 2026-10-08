import React, { memo, useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAccounts } from "@/hooks/queries/useAccounts";
import { useCategories } from "@/hooks/queries/useCategories";
import { useTransactions, type Transaction } from "@/hooks/queries/useTransactions";
import { useDeleteTransaction } from "@/hooks/mutations/useFinanceMutations";
import { useTransactionForm } from "@/hooks/useTransactionForm";
import ModalCreateFinances from "@/ui/components/modalCreateFinances";
import { getQueryErrorMessage } from "@/lib/queryUtils";

const money = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
type FilterType = "ALL" | "EXPENSE" | "INCOME";
const Pill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} className={`mr-2 rounded-full border px-3 py-2 ${active ? "border-emerald-500 bg-emerald-500" : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"}`}>
    <Text className={`font-manrope-medium text-[12px] ${active ? "text-white" : "text-slate-600 dark:text-slate-200"}`}>{label}</Text>
  </Pressable>
);
const MovementItem = memo(function MovementItem({ item, onEdit, onDelete }: { item: Transaction; onEdit: (value: Transaction) => void; onDelete: (value: Transaction) => void }) {
  return (
    <View className="mb-2 flex-row items-center rounded-2xl bg-white px-4 py-3 dark:bg-slate-900">
      <View className={`mr-3 h-11 w-11 items-center justify-center rounded-full ${item.type === "INCOME" ? "bg-emerald-50 dark:bg-emerald-900/30" : "bg-rose-50 dark:bg-rose-900/30"}`}>
        <MaterialCommunityIcons name={item.type === "INCOME" ? "arrow-down-left" : "arrow-up-right"} size={22} color={item.type === "INCOME" ? "#10b981" : "#f43f5e"} />
      </View>
      <View className="flex-1">
        <Text className="font-manrope-bold text-[13px] text-slate-900 dark:text-white" numberOfLines={1}>{item.description || item.category?.name || (item.type === "INCOME" ? "Ingreso" : "Gasto")}</Text>
        <Text className="font-manrope text-[11px] text-slate-500">{item.sourceAccount?.name ?? "Sin cuenta"} · {new Date(item.occurredAt).toLocaleDateString("es-MX")}</Text>
      </View>
      <View className="items-end">
        <Text className={`font-manrope-bold text-[14px] ${item.type === "INCOME" ? "text-emerald-500" : "text-rose-500"}`}>{item.type === "INCOME" ? "+" : "−"}{money(item.amount)}</Text>
        <View className="mt-2 flex-row gap-4">
          {(["EXPENSE", "INCOME"] as string[]).includes(item.type) && <Pressable onPress={() => onEdit(item)} accessibilityLabel="Editar movimiento"><MaterialCommunityIcons name="pencil-outline" size={20} color="#64748b" /></Pressable>}
          <Pressable onPress={() => onDelete(item)} accessibilityLabel="Eliminar movimiento"><MaterialCommunityIcons name="trash-can-outline" size={20} color="#e11d48" /></Pressable>
        </View>
      </View>
    </View>
  );
});
export default function Movements() {
  const [type, setType] = useState<FilterType>("ALL");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const accounts = useAccounts();
  const categories = useCategories(type === "INCOME" ? "INCOME" : "EXPENSE");
  const form = useTransactionForm();
  const filters = useMemo(() => ({
    type: type === "ALL" ? undefined : type,
    accountId: accountId || undefined,
    categoryId: categoryId || undefined,
    from: /^\d{4}-\d{2}-\d{2}$/.test(from) ? `${from}T00:00:00.000Z` : undefined,
    to: /^\d{4}-\d{2}-\d{2}$/.test(to) ? `${to}T23:59:59.999Z` : undefined,
    search: search || undefined,
    take: 20, skip: page * 20,
  }), [type, accountId, categoryId, from, to, search, page]);
  const { data, isPending, isRefetching, error, refetch } = useTransactions(filters);
  const deletion = useDeleteTransaction();
  const confirmDelete = useCallback((tx: Transaction) => {
    Alert.alert("Anular movimiento", `¿Anular ${money(tx.amount)}? El saldo y los reportes se actualizarán.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Anular", style: "destructive", onPress: async () => {
        try { await deletion.mutateAsync(tx.id); Alert.alert("Listo", "Movimiento anulado."); }
        catch (e) { Alert.alert("Error", getQueryErrorMessage(e)); }
      } },
    ]);
  }, [deletion]);
  const handleEdit = useCallback((tx: Transaction) => {
    if (tx.type !== "EXPENSE" && tx.type !== "INCOME") return;
    form.openEdit({ id: tx.id, type: tx.type, amount: tx.amount, categoryId: tx.categoryId, sourceAccountId: tx.sourceAccountId, description: tx.description, occurredAt: tx.occurredAt });
  }, [form.openEdit]);
  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <FlatList
        data={data?.items ?? []}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <MovementItem item={item} onEdit={handleEdit} onDelete={confirmDelete} />}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}
        refreshing={isRefetching}
        onRefresh={() => void refetch()}
        ListHeaderComponent={<View>
          <View className="flex-row items-center justify-between py-4">
            <Text className="font-manrope-bold text-[23px] text-slate-900 dark:text-white">Movimientos</Text>
            <Pressable className="rounded-xl bg-emerald-500 px-4 py-2" onPress={form.openCreate}><Text className="font-manrope-bold text-white">+ Nuevo</Text></Pressable>
          </View>
          <View className="mb-3 flex-row items-center gap-2">
            <TextInput value={draft} onChangeText={setDraft} placeholder="Buscar descripción o comercio" placeholderTextColor="#94a3b8" className="flex-1 rounded-xl bg-white px-4 py-3 font-manrope text-slate-900 dark:bg-slate-900 dark:text-white" onSubmitEditing={() => { setPage(0); setSearch(draft.trim()); }} returnKeyType="search" />
            <Pressable className="rounded-xl bg-slate-900 p-3 dark:bg-slate-700" onPress={() => { setPage(0); setSearch(draft.trim()); }}><MaterialCommunityIcons name="magnify" color="white" size={20} /></Pressable>
            <Pressable className="rounded-xl bg-slate-200 p-3 dark:bg-slate-800" onPress={() => setFilterOpen(!filterOpen)}><MaterialCommunityIcons name="filter-variant" color="#64748b" size={20} /></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <Pill label="Todos" active={type === "ALL"} onPress={() => { setType("ALL"); setCategoryId(""); setPage(0); }} />
            <Pill label="Gastos" active={type === "EXPENSE"} onPress={() => { setType("EXPENSE"); setCategoryId(""); setPage(0); }} />
            <Pill label="Ingresos" active={type === "INCOME"} onPress={() => { setType("INCOME"); setCategoryId(""); setPage(0); }} />
          </ScrollView>
          {filterOpen && <View className="mb-4 gap-2 rounded-2xl bg-white p-4 dark:bg-slate-900">
            <Text className="font-manrope-bold text-slate-900 dark:text-white">Fechas (AAAA-MM-DD)</Text>
            <View className="flex-row gap-2">
              <TextInput value={from} onChangeText={t => { setFrom(t); setPage(0); }} placeholder="Desde" placeholderTextColor="#94a3b8" className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-slate-900 dark:bg-slate-800 dark:text-white" />
              <TextInput value={to} onChangeText={t => { setTo(t); setPage(0); }} placeholder="Hasta" placeholderTextColor="#94a3b8" className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-slate-900 dark:bg-slate-800 dark:text-white" />
            </View>
            <Text className="font-manrope-bold text-slate-900 dark:text-white">Cuenta</Text>
            <ScrollView horizontal><Pill label="Todas" active={!accountId} onPress={() => { setAccountId(""); setPage(0); }} />{(accounts.data ?? []).map(a => <Pill key={a.id} label={a.name} active={accountId === a.id} onPress={() => { setAccountId(a.id); setPage(0); }} />)}</ScrollView>
            <Text className="font-manrope-bold text-slate-900 dark:text-white">Categoría</Text>
            <ScrollView horizontal><Pill label="Todas" active={!categoryId} onPress={() => { setCategoryId(""); setPage(0); }} />{(categories.data ?? []).map(c => <Pill key={c.id} label={c.name} active={categoryId === c.id} onPress={() => { setCategoryId(c.id); setPage(0); }} />)}</ScrollView>
            <Pressable onPress={() => { setFrom(""); setTo(""); setCategoryId(""); setAccountId(""); setSearch(""); setDraft(""); setPage(0); }}><Text className="font-manrope-bold text-emerald-500">Limpiar filtros</Text></Pressable>
          </View>}
          {error && <Text className="mb-3 text-rose-500">{getQueryErrorMessage(error)}</Text>}
          <Text className="mb-3 font-manrope text-[12px] text-slate-500">{data?.total ?? 0} movimientos · Página {page + 1}</Text>
        </View>}
        ListEmptyComponent={isPending ? <ActivityIndicator color="#10b981" /> : <Text className="mt-10 text-center font-manrope text-slate-500">No hay movimientos con estos filtros.</Text>}
        ListFooterComponent={<View className="mt-3 flex-row justify-between">
          <Pressable disabled={page === 0} onPress={() => setPage(p => Math.max(0, p - 1))} className="rounded-xl bg-slate-200 px-5 py-3 dark:bg-slate-800"><Text className="font-manrope-bold text-slate-700 dark:text-white">Anterior</Text></Pressable>
          <Pressable disabled={(page + 1) * 20 >= (data?.total ?? 0)} onPress={() => setPage(p => p + 1)} className="rounded-xl bg-emerald-500 px-5 py-3"><Text className="font-manrope-bold text-white">Siguiente</Text></Pressable>
        </View>}
      />
      <ModalCreateFinances modalVisible={form.visible} onClose={form.close} editing={form.editing} />
    </SafeAreaView>
  );
}
