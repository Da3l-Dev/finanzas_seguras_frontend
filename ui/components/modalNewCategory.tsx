import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { useCreateCategory, useUpdateCategory } from "@/hooks/mutations/useFinanceMutations";
import { getFieldErrors } from "@/lib/queryUtils";
import type { Category } from "@/hooks/queries/useCategories";
import { Alert } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ═══════════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════════
type TipoCategoria = "EXPENSE" | "INCOME";

export type CategoriaCreada = {
  id: string;
  name: string;
  type: TipoCategoria;
  icon: string;
  color: string | null;
};

type Props = {
  visible: boolean;
  tipo: TipoCategoria;
  onClose: () => void;
  onCrear?: (categoria: CategoriaCreada) => void;
  editing?: Category | null;
};

// ═══════════════════════════════════════════════════════════════
// Catálogo de iconos
// ═══════════════════════════════════════════════════════════════
const TODOS_LOS_ICONOS = Object.keys(
  MaterialCommunityIcons.glyphMap,
) as string[];

const DEFAULT_EXPENSE: string[] = [
  "food",
  "silverware-fork-knife",
  "cart",
  "cart-outline",
  "basket",
  "gas-station",
  "car",
  "bus",
  "bike",
  "airplane",
  "train",
  "home",
  "lightbulb",
  "water",
  "fire",
  "flash",
  "wifi",
  "cellphone",
  "laptop",
  "medical-bag",
  "pill",
  "hospital-box",
  "heart",
  "dumbbell",
  "school",
  "movie",
  "music",
  "gamepad-variant",
  "tshirt-crew",
  "shoe-sneaker",
  "paw",
  "dog",
  "cat",
  "flower",
  "coffee",
  "glass-mug-variant",
  "glass-cocktail",
  "cigarette",
  "tools",
  "gift",
  "baby-carriage",
  "package-variant",
  "cash-remove",
];

const DEFAULT_INCOME: string[] = [
  "cash",
  "cash-multiple",
  "cash-plus",
  "wallet",
  "bank",
  "briefcase",
  "laptop",
  "chart-line",
  "chart-bar",
  "trending-up",
  "gift",
  "hand-coin",
  "piggy-bank",
  "sack",
  "diamond-stone",
  "currency-usd",
  "currency-eur",
  "currency-mxn",
  "credit-card-plus",
  "account-cash",
  "coins",
  "sale",
  "store",
  "cart-plus",
];

const MAX_RESULTADOS = 120;

// ═══════════════════════════════════════════════════════════════
// Componente
// ═══════════════════════════════════════════════════════════════
export default function ModalNewCategory({
  visible,
  tipo: tipoProp,
  onClose,
  onCrear,
  editing,
}: Props) {
  const { token } = useAuth();

  const [tipo, setTipo] = useState<TipoCategoria>(tipoProp);
  const [nombre, setNombre] = useState("");
  const [icono, setIcono] = useState<string>(
    tipoProp === "INCOME" ? "cash" : "cart",
  );
  const [busqueda, setBusqueda] = useState("");
  const [color, setColor] = useState<string>(tipoProp === "INCOME" ? "#10b981" : "#f43f5e");
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const loading = createMutation.isPending || updateMutation.isPending;
  const [serverError, setServerError] = useState<string | null>(null);

  // Sincroniza el tipo cuando se abre el modal con otro tipo
  useEffect(() => {
    if (visible) {
      setTipo(editing?.type ?? tipoProp);
      setNombre(editing?.name ?? "");
      setIcono(editing?.icon ?? (tipoProp === "INCOME" ? "cash" : "cart"));
      setColor(editing?.color ?? (tipoProp === "INCOME" ? "#10b981" : "#f43f5e"));
    }
  }, [visible, tipoProp, editing?.id]);

  const defaults = tipo === "INCOME" ? DEFAULT_INCOME : DEFAULT_EXPENSE;

  const iconosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return defaults;
    return TODOS_LOS_ICONOS.filter((name) => name.includes(q)).slice(
      0,
      MAX_RESULTADOS,
    );
  }, [busqueda, defaults]);

  const esIngreso = tipo === "INCOME";
  const accentBg = esIngreso ? "bg-emerald-500" : "bg-rose-500";
  const accentText = esIngreso ? "text-emerald-500" : "text-rose-500";

  const reset = () => {
    setNombre("");
    setBusqueda("");
    setColor(tipo === "INCOME" ? "#10b981" : "#f43f5e");
    setIcono(tipo === "INCOME" ? "cash" : "cart");
    setServerError(null);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleCambiarTipo = (nuevoTipo: TipoCategoria) => {
    if (nuevoTipo === tipo || editing) return;
    setTipo(nuevoTipo);
    setColor(nuevoTipo === "INCOME" ? "#10b981" : "#f43f5e");
    setIcono(nuevoTipo === "INCOME" ? "cash" : "cart");
    setBusqueda("");
    setServerError(null);
  };

  const handleCrear = async () => {
    if (nombre.trim().length < 2 || loading) return;
    if (!token) {
      setServerError("No hay sesión activa.");
      return;
    }

    setServerError(null);


    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, changes: { name: nombre.trim(), icon: icono, color } });
        Alert.alert("Listo", "Categoría actualizada.");
        reset();
        onClose();
        return;
      }
      const created = await createMutation.mutateAsync({
        name: nombre.trim(), type: tipo, icon: icono, color,
      });

      onCrear?.({
        id: created.id,
        name: created.name,
        type: created.type,
        icon: created.icon ?? "cart",
        color: created.color,
      });

      reset();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        const body = e.body as {
          errors?: Record<string, string>;
          message?: string;
        } | null;
        const specific = getFieldErrors(e).name ?? e.message;
        setServerError(specific);
      } else if (e instanceof Error) {
        setServerError(e.message);
      } else {
        setServerError("No se pudo crear la categoría.");
      }
    }
  };

  const deshabilitado = nombre.trim().length < 2 || loading;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={handleClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <SafeAreaView
            edges={["bottom"]}
            className="rounded-t-[28px] bg-white dark:bg-[#0f172a]"
            style={{ maxHeight: "90%" }}
          >
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 18 }} keyboardShouldPersistTaps="handled">
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </View>

            <Text className="mb-1 font-manrope-bold text-[18px] text-slate-900 dark:text-white">
              {editing ? "Editar categoría" : "Nueva categoría"}
            </Text>
            <Text className="mb-4 font-manrope text-[13px] text-slate-500">
              {editing ? "Modifica el nombre, ícono o color" : "Elige el tipo, nombre, ícono y color"}
            </Text>

            {/* ─── Toggle Gasto / Ingreso ─────────────── */}
            <View className="mb-4 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
              {(["EXPENSE", "INCOME"] as TipoCategoria[]).map((op) => {
                const activo = tipo === op;
                const label = op === "EXPENSE" ? "Gasto" : "Ingreso";
                const colorActivo =
                  op === "EXPENSE" ? "bg-rose-500" : "bg-emerald-500";
                return (
                  <Pressable
                    key={op}
                    onPress={() => handleCambiarTipo(op)}
                    disabled={loading}
                    className={`flex-1 items-center rounded-xl py-2.5 ${
                      activo ? colorActivo : "bg-transparent"
                    }`}
                  >
                    <Text
                      className={`font-manrope-bold text-[13px] ${
                        activo
                          ? "text-white"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ─── Nombre ─────────────────────────────── */}
            <TextInput
              value={nombre}
              onChangeText={(t) => {
                setNombre(t);
                setServerError(null);
              }}
              placeholder={
                esIngreso ? "Ej. Salario, Ventas…" : "Ej. Café, Gym…"
              }
              placeholderTextColor="#94a3b8"
              maxLength={30}
              autoFocus
              editable={!loading}
              className="mb-4 rounded-2xl bg-slate-100 px-4 py-3.5 font-manrope text-[15px] text-slate-900 dark:bg-slate-800 dark:text-white"
            />

            {/* ─── Buscador ───────────────────────────── */}
            <View className="mb-3 flex-row items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color="#94a3b8"
              />
              <TextInput
                value={busqueda}
                onChangeText={setBusqueda}
                placeholder="Buscar icono…"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                className="flex-1 font-manrope text-[13px] text-slate-900 dark:text-white"
              />
              {busqueda.length > 0 && (
                <Pressable onPress={() => setBusqueda("")} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={18}
                    color="#94a3b8"
                  />
                </Pressable>
              )}
            </View>

            <Text className="mb-2 font-manrope-medium text-[12px] text-slate-500">Color</Text>
            <View className="mb-4 flex-row flex-wrap gap-3">
              {["#10b981", "#f43f5e", "#6366f1", "#f59e0b", "#0ea5e9", "#8b5cf6", "#64748b"].map(item => (
                <Pressable key={item} onPress={() => setColor(item)} disabled={loading}
                  accessibilityLabel={`Elegir color ${item}`}
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: item }}>
                  {color === item && <MaterialCommunityIcons name="check" size={23} color="#ffffff" />}
                </Pressable>
              ))}
            </View>

            {/* ─── Preview del icono seleccionado ────── */}
            <View className="mb-3 flex-row items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <View
                className="h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: color }}
              >
                <MaterialCommunityIcons
                  name={icono as any}
                  size={22}
                  color="#ffffff"
                />
              </View>
              <View className="flex-1">
                <Text className="font-manrope text-[11px] uppercase tracking-wide text-slate-400">
                  Icono seleccionado
                </Text>
                <Text
                  className={`font-manrope-bold text-[13px] ${accentText}`}
                  numberOfLines={1}
                >
                  {icono}
                </Text>
              </View>
            </View>

            {/* ─── Grid de iconos centrado ───────────── */}
            <Text className="mb-2 font-manrope-medium text-[12px] text-slate-500">
              {busqueda.trim()
                ? `${iconosFiltrados.length} resultado${
                    iconosFiltrados.length === 1 ? "" : "s"
                  }`
                : "Sugeridos"}
            </Text>

            <ScrollView
              style={{ maxHeight: 220 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {iconosFiltrados.length === 0 ? (
                <View className="items-center py-6">
                  <MaterialCommunityIcons
                    name="emoticon-sad-outline"
                    size={28}
                    color="#94a3b8"
                  />
                  <Text className="mt-2 font-manrope text-[12px] text-slate-500">
                    Sin resultados para "{busqueda}"
                  </Text>
                </View>
              ) : (
                <View
                  className="flex-row flex-wrap pb-2"
                  style={{
                    justifyContent: "center",
                    columnGap: 10,
                    rowGap: 10,
                  }}
                >
                  {iconosFiltrados.map((nombreIcono) => {
                    const activo = icono === nombreIcono;
                    return (
                      <Pressable
                        key={nombreIcono}
                        onPress={() => setIcono(nombreIcono)}
                        disabled={loading}
                        className={`h-12 w-12 items-center justify-center rounded-full ${
                          activo ? accentBg : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <MaterialCommunityIcons
                          name={nombreIcono as any}
                          size={22}
                          color={activo ? "#ffffff" : "#64748b"}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* ─── Error ─────────────────────────────── */}
            {serverError && (
              <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color="#e11d48"
                />
                <Text className="flex-1 font-manrope text-[12px] text-rose-600 dark:text-rose-400">
                  {serverError}
                </Text>
              </View>
            )}

            {/* ─── CTA ───────────────────────────────── */}
            <Pressable
              onPress={handleCrear}
              disabled={deshabilitado}
              className={`mt-4 items-center rounded-2xl py-4 ${accentBg} ${
                deshabilitado ? "opacity-30" : ""
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-manrope-bold text-[15px] text-white">
                  {editing ? "Guardar categoría" : `Crear ${esIngreso ? "ingreso" : "gasto"}`}
                </Text>
              )}
            </Pressable>

            <View className="h-6" />
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
