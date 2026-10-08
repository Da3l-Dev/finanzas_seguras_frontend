import { useAuth } from "@/context/AuthContext";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/hooks/mutations/useFinanceMutations";
import { useAccounts } from "@/hooks/queries/useAccounts";
import { useCategories } from "@/hooks/queries/useCategories";
import type { EditingTransaction } from "@/hooks/useTransactionForm";
import { ApiError } from "@/lib/api";
import { toIconName } from "@/lib/icons";
import { getFieldErrors } from "@/lib/queryUtils";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import ModalNewAccount from "./modalNewAccount";
import ModalNewCategory from "./modalNewCategory";

// ═══════════════════════════════════════════════════════════════
// Tipos
// ═══════════════════════════════════════════════════════════════
type TipoTransaccion = "EXPENSE" | "INCOME";

type CategoriaUI = {
  id: string;
  name: string;
  type: TipoTransaccion;
  icon: string;
  color: string | null;
};

type CuentaUI = {
  id: string;
  name: string;
  type: string;
  icon: { android: string; web: string };
  currentBalance: number;
  openingBalance: number;
  creditLimit: number | null;
  creditAvailable: number | null;
};

type Props = {
  modalVisible: boolean;
  onClose: () => void;
  editing?: EditingTransaction | null;
};

const ICON_ACCOUNT = {
  android: "account_balance_wallet",
  web: "account_balance_wallet",
};

function mapAccountIcon(
  raw: string | null | undefined,
  fallback: { android: string; web: string },
): { android: string; web: string } {
  if (!raw) return fallback;
  return { android: raw, web: raw };
}

const formatMXN = (n: number) =>
  Math.abs(n).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ═══════════════════════════════════════════════════════════════
// Componente
// ═══════════════════════════════════════════════════════════════
export default function ModalCreateFinances({
  modalVisible,
  onClose,
  editing,
}: Props) {
  const { token } = useAuth();

  const [tipo, setTipo] = useState<TipoTransaccion>("EXPENSE");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [cuentaId, setCuentaId] = useState<string | null>(null);
  const [nota, setNota] = useState("");

  const accountsQuery = useAccounts();
  const categoriesQuery = useCategories(tipo);
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const cuentas: CuentaUI[] = (accountsQuery.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    icon: mapAccountIcon(a.icon, ICON_ACCOUNT),
    currentBalance: a.currentBalance,
    openingBalance: a.openingBalance,
    creditLimit: a.creditLimit,
    creditAvailable: a.creditAvailable,
  }));

  const categorias: CategoriaUI[] = (categoriesQuery.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: toIconName(c.icon),
    color: c.color,
  }));

  const loadingCuentas = accountsQuery.isPending;
  const loadingCategorias = categoriesQuery.isPending;
  const saving = createTransaction.isPending || updateTransaction.isPending;
  const [error, setError] = useState<string | null>(null);
  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);

  useEffect(() => {
    if (!modalVisible || !cuentas.length) return;
    if (!cuentas.some((c) => c.id === cuentaId)) {
      const def = accountsQuery.data?.find((a) => a.isDefault);
      setCuentaId(def?.id ?? cuentas[0].id);
    }
  }, [modalVisible, cuentaId, accountsQuery.data, cuentas]);

  useEffect(() => {
    if (!modalVisible) return;
    if (editing) {
      setTipo(editing.type);
      setMonto(String(editing.amount));
      setCategoriaId(editing.categoryId);
      setCuentaId(editing.sourceAccountId);
      setNota(editing.description ?? "");
    } else {
      setTipo("EXPENSE");
      setMonto("");
      setCategoriaId(null);
      setNota("");
    }
    setError(null);
  }, [modalVisible, editing?.id]);

  useEffect(() => {
    if (!editing) setCategoriaId(null);
  }, [tipo, editing]);

  // ═══════════════════════════════════════════════════════════════
  // Validación de saldo
  // ═══════════════════════════════════════════════════════════════
  const cuentaSeleccionada = useMemo(
    () => cuentas.find((c) => c.id === cuentaId) ?? null,
    [cuentas, cuentaId],
  );

  const montoNum = parseFloat(monto.replace(",", ".")) || 0;

  // Saldo disponible según tipo de cuenta
  const saldoDisponible = useMemo(() => {
    if (!cuentaSeleccionada) return null;
    if (cuentaSeleccionada.type === "CREDIT_CARD") {
      return cuentaSeleccionada.creditAvailable ?? null;
    }
    return Math.max(0, cuentaSeleccionada.currentBalance);
  }, [cuentaSeleccionada]);

  // Exceso de gasto (solo aplica a EXPENSE, no al editar)
  const excedeSaldo = useMemo(() => {
    if (tipo !== "EXPENSE" || editing) return false;
    if (!cuentaSeleccionada) return false;
    if (saldoDisponible === null) return false;
    return montoNum > saldoDisponible;
  }, [tipo, editing, cuentaSeleccionada, saldoDisponible, montoNum]);

  const faltante =
    excedeSaldo && saldoDisponible !== null ? montoNum - saldoDisponible : 0;

  // ============ Reset ============
  const resetForm = () => {
    setTipo("EXPENSE");
    setMonto("");
    setCategoriaId(null);
    setNota("");
    setError(null);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  // ============ Guardar ============
  const handleGuardar = async () => {
    if (!token || saving) return;

    if (!montoNum || montoNum <= 0) {
      setError("Ingresa un monto válido.");
      return;
    }
    if (!categoriaId) {
      setError("Selecciona una categoría.");
      return;
    }
    if (!cuentaId) {
      setError("Selecciona una cuenta.");
      return;
    }

    if (excedeSaldo && saldoDisponible !== null) {
      const nombreCuenta = cuentaSeleccionada?.name ?? "esta cuenta";
      const esCredito = cuentaSeleccionada?.type === "CREDIT_CARD";
      setError(
        esCredito
          ? `Excedes el crédito disponible de "${nombreCuenta}" por $${formatMXN(faltante)}.`
          : `Saldo insuficiente en "${nombreCuenta}". Te faltan $${formatMXN(faltante)}.`,
      );
      return;
    }

    setError(null);

    try {
      const payload = {
        type: tipo,
        amount: montoNum,
        categoryId: categoriaId,
        sourceAccountId: cuentaId,
        description: nota.trim() || undefined,
        occurredAt: editing?.occurredAt ?? new Date().toISOString(),
      };
      if (editing) {
        await updateTransaction.mutateAsync({
          id: editing.id,
          changes: payload,
        });
      } else {
        await createTransaction.mutateAsync(payload);
      }
      Alert.alert(
        "Listo",
        editing ? "Movimiento actualizado." : "Movimiento registrado.",
      );
      resetForm();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        const fields = getFieldErrors(e);
        setError(fields.amount ?? fields.categoryId ?? e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("No se pudo guardar la transacción.");
      }
    }
  };

  // ============ Crear categoría ============
  const handleCrearCategoria = (nueva: {
    id: string;
    name: string;
    type: TipoTransaccion;
    icon: string;
    color?: string | null;
  }) => {
    const mapped: CategoriaUI = {
      id: nueva.id,
      name: nueva.name,
      type: nueva.type,
      icon: toIconName(nueva.icon),
      color: nueva.color ?? null,
    };

    if (nueva.type !== tipo) {
      setTipo(nueva.type);
      setCategoriaId(mapped.id);
      setShowNuevaCategoria(false);
      return;
    }

    setCategoriaId(mapped.id);
    setShowNuevaCategoria(false);
  };

  // ============ Crear cuenta ============
  const handleCrearCuenta = (nueva: {
    id: string;
    name: string;
    type: string;
    icon?: { android: string; web: string } | string | null;
  }) => {
    const mapped: CuentaUI = {
      id: nueva.id,
      name: nueva.name,
      type: nueva.type,
      icon:
        typeof nueva.icon === "string"
          ? mapAccountIcon(nueva.icon, ICON_ACCOUNT)
          : (nueva.icon ?? ICON_ACCOUNT),
      currentBalance: 0,
      openingBalance: 0,
      creditLimit: null,
      creditAvailable: null,
    };

    setCuentaId(mapped.id);
    setShowNuevaCuenta(false);
  };

  const esIngreso = tipo === "INCOME";
  const accentBg = esIngreso ? "bg-emerald-500" : "bg-rose-500";
  const accentText = esIngreso ? "text-emerald-500" : "text-rose-500";

  const guardarDeshabilitado =
    saving ||
    !monto ||
    montoNum <= 0 ||
    !categoriaId ||
    !cuentaId ||
    excedeSaldo;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={modalVisible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/40"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        <SafeAreaView
          edges={["bottom"]}
          className="rounded-t-[28px] bg-white dark:bg-[#0f172a]"
        >
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Tabs */}
            <View className="mt-4 flex-row px-6">
              {(["EXPENSE", "INCOME"] as TipoTransaccion[]).map((op) => {
                const activo = tipo === op;
                const label = op === "EXPENSE" ? "Gasto" : "Ingreso";
                const underline =
                  op === "EXPENSE" ? "bg-rose-500" : "bg-emerald-500";
                return (
                  <Pressable
                    key={op}
                    onPress={() => setTipo(op)}
                    className="mr-7 items-center pb-2"
                  >
                    <Text
                      className={`text-[15px] ${
                        activo
                          ? "font-manrope-bold text-slate-900 dark:text-white"
                          : "font-manrope text-slate-400"
                      }`}
                    >
                      {label}
                    </Text>
                    <View
                      className={`mt-1.5 h-[2px] w-full rounded-full ${
                        activo ? underline : "bg-transparent"
                      }`}
                    />
                  </Pressable>
                );
              })}
            </View>

            {/* Monto */}
            <View className="mt-5 items-center px-6">
              <View className="flex-row items-baseline">
                <Text className={`font-manrope-bold text-[28px] ${accentText}`}>
                  $
                </Text>
                <TextInput
                  value={monto}
                  onChangeText={(t) =>
                    setMonto(t.replace(/[^0-9.]/g, "").slice(0, 10))
                  }
                  placeholder="0"
                  placeholderTextColor="#cbd5e1"
                  keyboardType="decimal-pad"
                  autoFocus
                  editable={!saving}
                  className={`ml-2 font-manrope-bold text-[56px] leading-[64px] ${accentText}`}
                  style={{ minWidth: 80 }}
                />
              </View>
            </View>

            {/* Saldo disponible + alerta */}
            {cuentaSeleccionada && saldoDisponible !== null && (
              <View className="mx-6 mt-3 items-center">
                <Text className="font-manrope text-[12px] text-slate-400">
                  {cuentaSeleccionada.type === "CREDIT_CARD"
                    ? "Crédito disponible"
                    : "Saldo disponible"}{" "}
                  en {cuentaSeleccionada.name}:{" "}
                  <Text
                    className={`font-manrope-bold ${
                      excedeSaldo
                        ? "text-rose-500"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    ${formatMXN(saldoDisponible)}
                  </Text>
                </Text>
              </View>
            )}

            {/* Alerta de exceso */}
            {excedeSaldo && (
              <View className="mx-6 mt-4 flex-row items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={18}
                  color="#e11d48"
                />
                <Text className="flex-1 font-manrope text-[12px] text-rose-600 dark:text-rose-400">
                  {cuentaSeleccionada?.type === "CREDIT_CARD"
                    ? `Excedes el crédito disponible por $${formatMXN(faltante)}. Reduce el monto.`
                    : `Saldo insuficiente. Te faltan $${formatMXN(faltante)}.`}
                </Text>
              </View>
            )}

            {/* Categorías */}
            <View className="mt-7">
              <View className="mb-3 flex-row items-center justify-between px-6">
                <Text className="font-manrope-medium text-[11px] uppercase tracking-wider text-slate-400">
                  Categoría
                </Text>
                <Pressable
                  onPress={() => setShowNuevaCategoria(true)}
                  hitSlop={8}
                  className="flex-row items-center gap-1"
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={14}
                    color="#10b981"
                  />
                  <Text className="font-manrope-bold text-[12px] text-emerald-500">
                    Nueva
                  </Text>
                </Pressable>
              </View>

              {loadingCategorias ? (
                <View className="mx-6 items-center rounded-2xl bg-slate-50 py-6 dark:bg-slate-800/50">
                  <ActivityIndicator
                    color={esIngreso ? "#10b981" : "#e11d48"}
                  />
                </View>
              ) : categorias.length === 0 ? (
                <View className="mx-6 items-center rounded-2xl bg-slate-50 py-6 dark:bg-slate-800/50">
                  <MaterialCommunityIcons
                    name="shape-outline"
                    size={28}
                    color="#94a3b8"
                  />
                  <Text className="mt-2 font-manrope-bold text-[13px] text-slate-700 dark:text-slate-200">
                    Sin categorías de {esIngreso ? "ingreso" : "gasto"}
                  </Text>
                  <Text className="mt-1 text-center font-manrope text-[12px] text-slate-500">
                    Crea la primera para clasificar tus movimientos.
                  </Text>
                  <Pressable
                    onPress={() => setShowNuevaCategoria(true)}
                    className="mt-3 rounded-full bg-emerald-500 px-4 py-2"
                  >
                    <Text className="font-manrope-bold text-[12px] text-white">
                      + Crear la primera
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingHorizontal: 24 }}
                >
                  {categorias.map((cat) => {
                    const activa = categoriaId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setCategoriaId(cat.id)}
                        className="items-center"
                      >
                        <View
                          className={`h-14 w-14 items-center justify-center rounded-full ${
                            activa ? accentBg : "bg-slate-100 dark:bg-slate-800"
                          }`}
                        >
                          <MaterialCommunityIcons
                            name={cat.icon as any}
                            size={24}
                            color={activa ? "#ffffff" : "#64748b"}
                          />
                        </View>
                        <Text
                          numberOfLines={1}
                          className={`mt-2 w-16 text-center text-[11px] ${
                            activa
                              ? "font-manrope-bold text-slate-900 dark:text-white"
                              : "font-manrope text-slate-500"
                          }`}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => setShowNuevaCategoria(true)}
                    className="items-center"
                  >
                    <View className="h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <MaterialCommunityIcons
                        name="plus"
                        size={22}
                        color="#94a3b8"
                      />
                    </View>
                    <Text className="mt-2 w-16 text-center text-[11px] font-manrope text-slate-400">
                      Nueva
                    </Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>

            {/* Cuentas */}
            <View className="mt-6">
              <View className="mb-3 flex-row items-center justify-between px-6">
                <Text className="font-manrope-medium text-[11px] uppercase tracking-wider text-slate-400">
                  Cuenta
                </Text>
                <Pressable
                  onPress={() => setShowNuevaCuenta(true)}
                  hitSlop={8}
                  className="flex-row items-center gap-1"
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={14}
                    color="#10b981"
                  />
                  <Text className="font-manrope-bold text-[12px] text-emerald-500">
                    Nueva
                  </Text>
                </Pressable>
              </View>

              {loadingCuentas ? (
                <View className="mx-6 items-center rounded-2xl bg-slate-50 py-6 dark:bg-slate-800/50">
                  <ActivityIndicator color="#10b981" />
                </View>
              ) : cuentas.length === 0 ? (
                <View className="mx-6 items-center rounded-2xl bg-slate-50 py-6 dark:bg-slate-800/50">
                  <MaterialCommunityIcons
                    name="wallet-outline"
                    size={28}
                    color="#94a3b8"
                  />
                  <Text className="mt-2 font-manrope-bold text-[13px] text-slate-700 dark:text-slate-200">
                    Sin cuentas
                  </Text>
                  <Text className="mt-1 text-center font-manrope text-[12px] text-slate-500">
                    Crea una cuenta para registrar el movimiento.
                  </Text>
                  <Pressable
                    onPress={() => setShowNuevaCuenta(true)}
                    className="mt-3 rounded-full bg-emerald-500 px-4 py-2"
                  >
                    <Text className="font-manrope-bold text-[12px] text-white">
                      + Crear la primera
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
                >
                  {cuentas.map((cuenta) => {
                    const activa = cuentaId === cuenta.id;
                    const esCredito = cuenta.type === "CREDIT_CARD";
                    const saldoMostrar = esCredito
                      ? (cuenta.creditAvailable ?? 0)
                      : Math.max(0, cuenta.currentBalance);

                    return (
                      <Pressable
                        key={cuenta.id}
                        onPress={() => setCuentaId(cuenta.id)}
                        className={`rounded-2xl px-4 py-2.5 ${
                          activa
                            ? "bg-slate-900 dark:bg-white"
                            : "bg-slate-100 dark:bg-slate-800"
                        }`}
                      >
                        <View className="flex-row items-center gap-2">
                          <MaterialCommunityIcons
                            name={
                              (Platform.OS === "android"
                                ? cuenta.icon.android
                                : cuenta.icon.web) as any
                            }
                            size={14}
                            color={activa ? "#fff" : "#64748b"}
                          />
                          <Text
                            className={`font-manrope-bold text-[13px] ${
                              activa
                                ? "text-white dark:text-slate-900"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {cuenta.name}
                          </Text>
                        </View>
                        <Text
                          className={`mt-0.5 font-manrope text-[10px] ${
                            activa
                              ? "text-white/70 dark:text-slate-600"
                              : "text-slate-400"
                          }`}
                        >
                          {esCredito ? "Disp." : "Saldo"}: $
                          {formatMXN(saldoMostrar)}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => setShowNuevaCuenta(true)}
                    className="flex-row items-center gap-1.5 self-center rounded-full border border-dashed border-slate-300 px-3 py-2 dark:border-slate-600"
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={14}
                      color="#94a3b8"
                    />
                    <Text className="font-manrope text-[13px] text-slate-400">
                      Nueva
                    </Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>

            {/* Nota */}
            <View className="mt-6 px-6">
              <View className="flex-row items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
                <MaterialCommunityIcons
                  name="note-edit-outline"
                  size={18}
                  color="#94a3b8"
                />
                <TextInput
                  value={nota}
                  onChangeText={setNota}
                  placeholder="Añadir nota…"
                  placeholderTextColor="#94a3b8"
                  maxLength={120}
                  editable={!saving}
                  className="flex-1 font-manrope text-[14px] text-slate-900 dark:text-white"
                />
              </View>
            </View>

            {/* Error */}
            {error && (
              <View className="mx-6 mt-4 flex-row items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color="#e11d48"
                />
                <Text className="flex-1 font-manrope text-[12px] text-rose-600 dark:text-rose-400">
                  {error}
                </Text>
              </View>
            )}

            {/* CTA */}
            <View className="mt-5 px-6">
              <Pressable
                onPress={handleGuardar}
                disabled={guardarDeshabilitado}
                className={`items-center rounded-2xl py-4 ${accentBg} ${
                  guardarDeshabilitado ? "opacity-30" : ""
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-manrope-bold text-[16px] text-white">
                    {editing
                      ? "Guardar cambios"
                      : `Guardar ${esIngreso ? "ingreso" : "gasto"}`}
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <ModalNewCategory
        visible={showNuevaCategoria}
        tipo={tipo}
        onClose={() => setShowNuevaCategoria(false)}
        onCrear={handleCrearCategoria as any}
      />

      <ModalNewAccount
        visible={showNuevaCuenta}
        onClose={() => setShowNuevaCuenta(false)}
        onCrear={handleCrearCuenta as any}
      />
    </Modal>
  );
}
