import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useGoals, useBudgets, type Goal } from "@/hooks/queries/usePlanning";
import { useCategories } from "@/hooks/queries/useCategories";
import { useCreateGoal, useUpdateGoal, useDeleteGoal, useContributeGoal, useSaveBudget, useDeleteBudget } from "@/hooks/mutations/usePlanningMutations";
import { getQueryErrorMessage } from "@/lib/queryUtils";
const mxn = (n: number) => n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
function Field({ label, value, onChangeText, numeric = false }: { label: string; value: string; onChangeText: (v: string) => void; numeric?: boolean }) {
  return <View className="mb-3"><Text className="mb-2 font-manrope-bold text-slate-700 dark:text-slate-200">{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType={numeric ? "decimal-pad" : "default"} placeholderTextColor="#94a3b8" className="rounded-xl bg-slate-100 px-4 py-3 text-slate-900 dark:bg-slate-800 dark:text-white" /></View>;
}
function Button({ label, onPress, danger = false, disabled = false }: { label: string; onPress: () => void; danger?: boolean; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} className={`items-center rounded-xl px-4 py-3 ${danger ? "bg-rose-50 dark:bg-rose-950/30" : "bg-emerald-500"}`}><Text className={`font-manrope-bold ${danger ? "text-rose-600" : "text-white"}`}>{label}</Text></Pressable>; }
export default function PlanningScreen() {
  const month = new Date().toISOString().slice(0, 7);
  const goals = useGoals();
  const budgets = useBudgets(month);
  const categories = useCategories("EXPENSE");
  const create = useCreateGoal(); const update = useUpdateGoal(); const del = useDeleteGoal(); const contribute = useContributeGoal(); const saveBudget = useSaveBudget(); const deleteBudget = useDeleteBudget();
  const [goalEditing, setGoalEditing] = useState<Goal | null>(null);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState(""); const [goalTarget, setGoalTarget] = useState(""); const [goalAmount, setGoalAmount] = useState("");
  const [budgetCategoryId, setBudgetCategoryId] = useState(""); const [budgetAmount, setBudgetAmount] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [message, setMessage] = useState("");
  const run = async (fn: () => Promise<unknown>, successMessage: string) => {
    setMessage("");
    try { await fn(); setMessage(successMessage); }
    catch (error) { Alert.alert("No se pudo guardar", getQueryErrorMessage(error)); }
  };
  const edit = (goal: Goal) => { setGoalEditing(goal); setGoalName(goal.name); setGoalTarget(String(goal.targetAmount)); setGoalAmount(""); setShowGoalForm(true); };
  const submitGoal = async () => {
    if (goalName.trim().length < 2 || !(Number(goalTarget) > 0)) { Alert.alert("Datos incompletos", "Escribe un nombre y un objetivo mayor a cero."); return; }
    await run(async () => {
      if (goalEditing) await update.mutateAsync({ id: goalEditing.id, name: goalName.trim(), targetAmount: Number(goalTarget) });
      else await create.mutateAsync({ name: goalName.trim(), targetAmount: Number(goalTarget) });
      setGoalEditing(null); setGoalName(""); setGoalTarget(""); setShowGoalForm(false);
    }, "Meta guardada.");
  };
  return <SafeAreaView className="flex-1 bg-slate-50 dark:bg-[#141313]">
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 90 }} keyboardShouldPersistTaps="handled">
      <View className="mb-5 flex-row items-center"><Pressable onPress={() => router.back()}><MaterialCommunityIcons name="arrow-left" color="#64748b" size={24} /></Pressable><Text className="ml-4 font-manrope-bold text-[22px] text-slate-900 dark:text-white">Planificación</Text></View>
      {!!message && <Text className="mb-4 rounded-xl bg-emerald-50 p-3 text-emerald-700">{message}</Text>}
      <View className="mb-3 flex-row items-center justify-between"><Text className="font-manrope-bold text-[18px] text-slate-900 dark:text-white">Metas de ahorro</Text><Pressable onPress={() => { setGoalEditing(null); setGoalName(""); setGoalTarget(""); setShowGoalForm(!showGoalForm); }}><Text className="font-manrope-bold text-emerald-500">+ Nueva</Text></Pressable></View>
      {showGoalForm && <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Field label="Nombre de la meta" value={goalName} onChangeText={setGoalName} />
        <Field label="Monto objetivo" value={goalTarget} numeric onChangeText={setGoalTarget} />
        <Button disabled={create.isPending || update.isPending} label="Guardar meta" onPress={() => void submitGoal()} />
      </View>}
      {goals.isPending && <ActivityIndicator color="#10b981" />}
      {goals.error && <Text className="mb-3 text-rose-500">{getQueryErrorMessage(goals.error)}</Text>}
      {(goals.data ?? []).map(g => <View key={g.id} className="mb-3 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <View className="flex-row items-center justify-between"><Text className="font-manrope-bold text-slate-900 dark:text-white">{g.name}</Text><Text className="font-manrope text-[12px] text-slate-500">{Math.min(100, Math.round(100 * g.savedAmount / g.targetAmount))}%</Text></View>
        <Text className="mb-3 font-manrope text-[12px] text-slate-500">{mxn(g.savedAmount)} de {mxn(g.targetAmount)}</Text>
        <View className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><View className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (g.savedAmount / g.targetAmount) * 100)}%` }} /></View>
        <View className="flex-row items-center gap-3"><Pressable onPress={() => edit(g)}><Text className="font-manrope-bold text-emerald-500">Editar</Text></Pressable><Pressable onPress={() => Alert.alert("Archivar meta", g.name, [{ text: "Cancelar" }, { text: "Archivar", style: "destructive", onPress: () => void run(() => del.mutateAsync(g.id), "Meta archivada.") }])}><Text className="font-manrope-bold text-rose-500">Archivar</Text></Pressable></View>
        <View className="mt-3 flex-row items-center gap-2"><TextInput value={contributionGoalId === g.id ? goalAmount : ""} onFocus={() => { setContributionGoalId(g.id); setGoalAmount(""); }} onChangeText={setGoalAmount} placeholder="Cantidad a apartar" keyboardType="decimal-pad" placeholderTextColor="#94a3b8" className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-slate-900 dark:bg-slate-800 dark:text-white" /><Pressable onPress={() => { if (!(Number(goalAmount) > 0) || contributionGoalId !== g.id) return; void run(async () => { await contribute.mutateAsync({ id: g.id, amount: Number(goalAmount) }); setGoalAmount(""); setContributionGoalId(null); }, "Apartado registrado."); }} className="rounded-xl bg-emerald-500 px-4 py-3"><Text className="font-manrope-bold text-white">Apartar</Text></Pressable></View>
      </View>)}
      <Text className="mb-5 font-manrope text-[11px] text-slate-500">Los apartados son virtuales: no mueven dinero de tus cuentas bancarias.</Text>
      <View className="mb-3 flex-row items-center justify-between"><Text className="font-manrope-bold text-[18px] text-slate-900 dark:text-white">Presupuestos · {month}</Text><Pressable onPress={() => setShowBudgetForm(!showBudgetForm)}><Text className="font-manrope-bold text-emerald-500">+ Nuevo</Text></Pressable></View>
      {showBudgetForm && <View className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <Text className="mb-3 font-manrope-bold text-slate-900 dark:text-white">Categoría de gasto</Text>
        <ScrollView horizontal className="mb-3">{(categories.data ?? []).map(c => <Pressable key={c.id} onPress={() => setBudgetCategoryId(c.id)} className={`mr-2 rounded-full px-3 py-2 ${budgetCategoryId === c.id ? "bg-emerald-500" : "bg-slate-100 dark:bg-slate-800"}`}><Text className={budgetCategoryId === c.id ? "text-white" : "text-slate-600 dark:text-white"}>{c.name}</Text></Pressable>)}</ScrollView>
        <Field label="Monto disponible para el mes" value={budgetAmount} numeric onChangeText={setBudgetAmount} />
        <Button label="Guardar presupuesto" disabled={saveBudget.isPending} onPress={() => { if (!budgetCategoryId || !(Number(budgetAmount) > 0)) { Alert.alert("Datos incompletos", "Elige categoría y monto."); return; } void run(async () => { await saveBudget.mutateAsync({ categoryId: budgetCategoryId, allocatedAmount: Number(budgetAmount), month: `${month}-01` }); setShowBudgetForm(false); setBudgetAmount(""); }, "Presupuesto guardado."); }} />
      </View>}
      {budgets.isPending && <ActivityIndicator color="#10b981" />}
      {budgets.error && <Text className="text-rose-500">{getQueryErrorMessage(budgets.error)}</Text>}
      {(budgets.data ?? []).map(b => <View key={b.id} className="mb-3 rounded-2xl bg-white p-4 dark:bg-slate-900">
        <View className="flex-row items-center justify-between"><Text className="font-manrope-bold text-slate-900 dark:text-white">{b.category.name}</Text><Pressable onPress={() => Alert.alert("Eliminar presupuesto", b.category.name, [{ text: "Cancelar" }, { text: "Desactivar", style: "destructive", onPress: () => void run(() => deleteBudget.mutateAsync(b.id), "Presupuesto desactivado.") }])}><MaterialCommunityIcons name="trash-can-outline" color="#e11d48" size={20} /></Pressable></View>
        <Text className="mb-3 text-slate-500">{mxn(b.spent)} / {mxn(b.allocatedAmount)}</Text>
        <View className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><View className={`h-2 rounded-full ${b.spent > b.allocatedAmount ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, b.spent / b.allocatedAmount * 100)}%` }} /></View>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}
