import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAllCategories, type Category } from "@/hooks/queries/useCategories";
import { useDeleteCategory, useRestoreCategory } from "@/hooks/mutations/useFinanceMutations";
import ModalNewCategory from "@/ui/components/modalNewCategory";
import { confirmCategoryDeletion } from "@/lib/deletionConfirm";
import { getQueryErrorMessage } from "@/lib/queryUtils";
import type { CategoryType } from "@/lib/queryKeys";

export default function CategoriesScreen() {
  const [type, setType] = useState<CategoryType>("EXPENSE");
  const [showArchived, setShowArchived] = useState(false);
  const query = useAllCategories(type);
  const remove = useDeleteCategory();
  const restore = useRestoreCategory();
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const categories = (query.data ?? []).filter(c => showArchived ? !c.isActive : c.isActive !== false);

  const edit = (category: Category) => {
    setEditing(category);
    setVisible(true);
  };
  const create = () => {
    setEditing(null);
    setVisible(true);
  };
  const restoreCategory = async (category: Category) => {
    try {
      await restore.mutateAsync(category.id);
      Alert.alert("Restaurada", `La categoría «${category.name}» vuelve a estar disponible.`);
    } catch (error) {
      Alert.alert("Error", getQueryErrorMessage(error));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
      <View className="flex-row items-center px-5 py-4">
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
        </Pressable>
        <Text className="ml-4 flex-1 font-manrope-bold text-[22px] text-slate-900 dark:text-white">Categorías</Text>
        <Pressable onPress={create} hitSlop={12}>
          <MaterialCommunityIcons name="plus-circle" size={27} color="#10b981" />
        </Pressable>
      </View>
      <View className="mx-5 mb-3 flex-row rounded-xl bg-white p-1 dark:bg-slate-900">
        {(["EXPENSE", "INCOME"] as CategoryType[]).map(t => (
          <Pressable key={t} onPress={() => setType(t)}
            className={`flex-1 items-center rounded-lg py-3 ${type === t ? "bg-emerald-500" : ""}`}>
            <Text className={`font-manrope-bold ${type === t ? "text-white" : "text-slate-500"}`}>
              {t === "EXPENSE" ? "Gastos" : "Ingresos"}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="mx-5 mb-4 flex-row items-center justify-between">
        <Text className="flex-1 font-manrope text-[12px] text-slate-500">
          {showArchived ? "Categorías ocultas anteriormente" : "Edita el nombre e ícono de tus categorías"}
        </Text>
        <Pressable onPress={() => setShowArchived(v => !v)} className="rounded-xl bg-slate-200 px-3 py-2 dark:bg-slate-800">
          <Text className="font-manrope-bold text-[12px] text-slate-700 dark:text-white">
            {showArchived ? "Ver activas" : "Ver archivadas"}
          </Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {query.isPending ? (
          <ActivityIndicator color="#10b981" />
        ) : query.error ? (
          <Pressable onPress={() => { void query.refetch(); }}>
            <Text className="font-manrope text-rose-500">{getQueryErrorMessage(query.error)} · Reintentar</Text>
          </Pressable>
        ) : categories.length === 0 ? (
          <Text className="mt-8 text-center font-manrope text-slate-500">No hay categorías en este apartado.</Text>
        ) : categories.map((category) => (
          <View key={category.id} className="mb-3 rounded-2xl bg-white px-4 py-4 dark:bg-slate-900">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="shape-outline" size={22} color={category.color ?? "#10b981"} />
              <Text className="ml-3 flex-1 font-manrope-bold text-[15px] text-slate-900 dark:text-white">
                {category.name}
              </Text>
              {category.isSystem && (
                <Text className="font-manrope text-[11px] text-slate-400">Sistema</Text>
              )}
            </View>
            <View className="mt-3 flex-row gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Pressable onPress={() => edit(category)} className="flex-1 flex-row items-center justify-center rounded-xl bg-slate-100 py-2.5 dark:bg-slate-800">
                <MaterialCommunityIcons name="pencil-outline" size={16} color="#10b981" />
                <Text className="ml-2 font-manrope-bold text-[12px] text-slate-700 dark:text-white">Editar</Text>
              </Pressable>
              {showArchived ? (
                <Pressable onPress={() => { void restoreCategory(category); }} disabled={restore.isPending} className="flex-1 items-center rounded-xl bg-emerald-50 py-2.5 dark:bg-emerald-950/30">
                  <Text className="font-manrope-bold text-[12px] text-emerald-600">Restaurar</Text>
                </Pressable>
              ) : null}
              {!category.isSystem && (
                <Pressable onPress={() => confirmCategoryDeletion(category.name, remove.mutateAsync, category.id)} disabled={remove.isPending}
                  className="flex-1 flex-row items-center justify-center rounded-xl bg-rose-50 py-2.5 dark:bg-rose-950/30">
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#e11d48" />
                  <Text className="ml-1 font-manrope-bold text-[12px] text-rose-600">Eliminar</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
      <ModalNewCategory
        visible={visible}
        tipo={type}
        editing={editing}
        onClose={() => { setVisible(false); setEditing(null); }}
      />
    </SafeAreaView>
  );
}
