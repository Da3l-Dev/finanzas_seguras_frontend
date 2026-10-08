import { useAuth } from "@/context/AuthContext";
import type { Cuenta, CuentaTipo } from "@/data/types/cuentas";
import { ApiError } from "@/lib/api";
import { useCreateAccount, useUpdateAccount, type AccountInput } from "@/hooks/mutations/useFinanceMutations";
import { getFieldErrors } from "@/lib/queryUtils";
import type { Account } from "@/hooks/queries/useAccounts";
import { Alert } from "react-native";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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

type Props = {
  visible: boolean;
  onClose: () => void;
  onCrear?: (cuenta: Cuenta) => void;
  editing?: Account | null;
};

// ═══════════════════════════════════════════════════════════════
// Configuración de tipos
// ═══════════════════════════════════════════════════════════════
type TipoConfig = {
  value: CuentaTipo;
  label: string;
  icon: { android: string; web: string };
  // Qué campos aplican
  showInstitution: boolean;
  institutionRequired: boolean;
  showLast4: boolean;
  showOpeningBalance: boolean;
  showCreditLimit: boolean;
  // Textos
  amountLabel: string;
  amountPlaceholder: string;
};

const TIPOS: TipoConfig[] = [
  {
    value: "CASH",
    label: "Efectivo",
    icon: { android: "payments", web: "payments" },
    showInstitution: false,
    institutionRequired: false,
    showLast4: false,
    showOpeningBalance: true,
    showCreditLimit: false,
    amountLabel: "¿Cuánto tienes en efectivo?",
    amountPlaceholder: "0.00",
  },
  {
    value: "DEBIT_CARD",
    label: "Débito",
    icon: { android: "credit_card", web: "credit_card" },
    showInstitution: true,
    institutionRequired: true,
    showLast4: true,
    showOpeningBalance: true,
    showCreditLimit: false,
    amountLabel: "Saldo actual",
    amountPlaceholder: "0.00",
  },
  {
    value: "CREDIT_CARD",
    label: "Crédito",
    icon: { android: "credit_card", web: "credit_card" },
    showInstitution: true,
    institutionRequired: true,
    showLast4: true,
    showOpeningBalance: false,
    showCreditLimit: true,
    amountLabel: "Límite de crédito",
    amountPlaceholder: "0.00",
  },
  {
    value: "SAVINGS",
    label: "Ahorro",
    icon: { android: "savings", web: "savings" },
    showInstitution: true,
    institutionRequired: false,
    showLast4: false,
    showOpeningBalance: true,
    showCreditLimit: false,
    amountLabel: "Saldo actual",
    amountPlaceholder: "0.00",
  },
  {
    value: "INVESTMENT",
    label: "Inversión",
    icon: { android: "trending_up", web: "trending_up" },
    showInstitution: true,
    institutionRequired: false,
    showLast4: false,
    showOpeningBalance: true,
    showCreditLimit: false,
    amountLabel: "Valor actual",
    amountPlaceholder: "0.00",
  },
];

// ═══════════════════════════════════════════════════════════════
// Componente
// ═══════════════════════════════════════════════════════════════
export default function ModalNewAccount({ visible, onClose, onCrear, editing }: Props) {
  const { token } = useAuth();

  const [nombre, setNombre] = useState("");
  const [tipoSel, setTipoSel] = useState<CuentaTipo>("CASH");
  const [institucion, setInstitucion] = useState("");
  const [last4, setLast4] = useState("");
  const [monto, setMonto] = useState("");
  const [esPrincipal, setEsPrincipal] = useState(false);
  const [incluirPatrimonio, setIncluirPatrimonio] = useState(true);
  const [colorCuenta, setColorCuenta] = useState("#10b981");
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const loading = createMutation.isPending || updateMutation.isPending;
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const config = useMemo(
    () => TIPOS.find((t) => t.value === tipoSel)!,
    [tipoSel],
  );

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setNombre(editing.name);
      setTipoSel(editing.type);
      setInstitucion(editing.institution ?? "");
      setLast4(editing.lastFourDigits ?? "");
      setMonto(String(editing.type === "CREDIT_CARD" ? (editing.creditLimit ?? 0) : editing.openingBalance));
      setEsPrincipal(editing.isDefault);
      setIncluirPatrimonio(editing.includeInNetWorth);
      setColorCuenta(editing.color ?? "#10b981");
    } else reset();
  }, [visible, editing?.id]);

  // Limpia campos que no aplican al cambiar de tipo
  useEffect(() => {
    if (!config.showInstitution) setInstitucion("");
    if (!config.showLast4) setLast4("");
    if (!config.showOpeningBalance && !config.showCreditLimit) setMonto("");
    setFieldErrors({});
    setServerError(null);
  }, [config]);

  const reset = () => {
    setNombre("");
    setTipoSel("CASH");
    setInstitucion("");
    setLast4("");
    setMonto("");
    setEsPrincipal(false);
    setIncluirPatrimonio(true);
    setColorCuenta("#10b981");
    setServerError(null);
    setFieldErrors({});
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (serverError) setServerError(null);
  };

  // ============ Validaciones locales ============
  const validar = (): { ok: boolean; errores: Record<string, string> } => {
    const errores: Record<string, string> = {};

    if (nombre.trim().length < 2) {
      errores.name = "El nombre debe tener al menos 2 caracteres.";
    }

    if (config.institutionRequired && institucion.trim().length < 2) {
      errores.institution = "Indica la institución.";
    }

    if (config.showLast4 && last4.length > 0 && last4.length !== 4) {
      errores.lastFourDigits = "Deben ser 4 dígitos.";
    }

    const montoNum = parseFloat(monto.replace(",", ".")) || 0;

    if (config.showCreditLimit && montoNum <= 0) {
      errores.creditLimit = "El límite debe ser mayor a 0.";
    }

    if (config.showOpeningBalance && montoNum < 0) {
      errores.openingBalance = "El saldo no puede ser negativo.";
    }

    return { ok: Object.keys(errores).length === 0, errores };
  };

  const handleCrear = async () => {
    if (loading) return;

    const { ok, errores } = validar();
    if (!ok) {
      setFieldErrors(errores);
      setServerError("Revisa los campos marcados.");
      return;
    }

    setServerError(null);
    setFieldErrors({});


    try {
      const montoNum = parseFloat(monto.replace(",", ".")) || 0;

      // Payload SOLO con lo que aplica
      const payload: AccountInput = {
        name: nombre.trim(),
        type: tipoSel,
        currency: "MXN",
        icon: config.icon.android,
        color: colorCuenta,
        includeInNetWorth: incluirPatrimonio,
        isDefault: esPrincipal,
      };

      if (config.showInstitution && institucion.trim()) {
        payload.institution = institucion.trim();
      }

      if (config.showLast4 && last4.length === 4) {
        payload.lastFourDigits = last4;
      }

      if (config.showOpeningBalance) {
        payload.openingBalance = montoNum;
      } else if (config.showCreditLimit) {
        payload.openingBalance = 0;
        payload.creditLimit = montoNum;
      }

      if (editing) {
        const changes = {
          name: nombre.trim(), type: tipoSel, icon: config.icon.android, color: colorCuenta,
          institution: config.showInstitution ? (institucion.trim() || null) : null,
          lastFourDigits: config.showLast4 ? (last4 || null) : null,
          openingBalance: config.showCreditLimit ? (editing.type === "CREDIT_CARD" ? editing.openingBalance : 0) : montoNum,
          creditLimit: config.showCreditLimit ? montoNum : null,
          isDefault: esPrincipal,
          includeInNetWorth: incluirPatrimonio,
        };
        await updateMutation.mutateAsync({ id: editing.id, changes });
        Alert.alert("Listo", "Cuenta actualizada.");
        reset();
        onClose();
        return;
      }
      const created = await createMutation.mutateAsync(payload);
      onCrear?.({
        id: created.id,
        name: created.name,
        type: created.type,
        icon: config.icon, // 👈 objeto { android, web } para la UI
        institution: institucion.trim() || null,
        openingBalance: config.showCreditLimit ? 0 : montoNum,
        creditLimit: config.showCreditLimit ? montoNum : null,
        isDefault: esPrincipal,
      } as Cuenta);

      reset();
      onClose();
    } catch (e) {
      if (e instanceof ApiError) {
        const fields = getFieldErrors(e);
        setFieldErrors(fields);
        const specific =
          fields.name ??
          fields.institution ??
          fields.lastFourDigits ??
          fields.creditLimit ??
          fields.openingBalance ??
          e.message;
        setServerError(specific);
      } else if (e instanceof Error) {
        setServerError(e.message);
      } else {
        setServerError("Error al crear la cuenta");
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
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end bg-black/40"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        <Pressable onPress={(e) => e.stopPropagation()}>
          <SafeAreaView
            edges={["bottom"]}
            className="rounded-t-[28px] bg-white dark:bg-[#0f172a]"
          >
            <View className="items-center pb-1 pt-3">
              <View className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text className="mb-1 font-manrope-bold text-[18px] text-slate-900 dark:text-white">
                {editing ? "Editar cuenta" : "Nueva cuenta"}
              </Text>
              <Text className="mb-5 font-manrope text-[13px] text-slate-500">
                {editing ? "Modifica los datos y el saldo inicial; el saldo actual se recalcula según tus movimientos." : "Configúrala según el tipo"}
              </Text>

              {/* Nombre */}
              <FieldLabel text="Nombre" error={fieldErrors.name} />
              <TextInput
                value={nombre}
                onChangeText={(t) => {
                  setNombre(t);
                  clearFieldError("name");
                }}
                placeholder="Ej. Nómina BBVA, Efectivo…"
                placeholderTextColor="#94a3b8"
                maxLength={40}
                autoFocus
                editable={!loading}
                className={`mb-4 rounded-2xl px-4 py-3.5 font-manrope text-[15px] text-slate-900 dark:text-white ${
                  fieldErrors.name
                    ? "bg-rose-50 dark:bg-rose-950/30"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              />

              {/* Tipo */}
              <Text className="mb-2 font-manrope-medium text-[12px] text-slate-500">
                Tipo
              </Text>
              <View className="mb-5 flex-row flex-wrap gap-2">
                {TIPOS.map((t) => {
                  const activa = tipoSel === t.value;
                  return (
                    <Pressable
                      key={t.value}
                      onPress={() => setTipoSel(t.value)}
                      disabled={loading}
                      className={`flex-row items-center gap-2 rounded-full px-4 py-2.5 ${
                        activa
                          ? "bg-slate-900 dark:bg-white"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      <SymbolView
                        name={t.icon as any}
                        size={14}
                        tintColor={activa ? "#fff" : "#64748b"}
                      />
                      <Text
                        className={`font-manrope-medium text-[13px] ${
                          activa
                            ? "text-white dark:text-slate-900"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Institución (condicional) */}
              {config.showInstitution && (
                <>
                  <FieldLabel
                    text={
                      config.institutionRequired
                        ? "Institución"
                        : "Institución (opcional)"
                    }
                    error={fieldErrors.institution}
                  />
                  <TextInput
                    value={institucion}
                    onChangeText={(t) => {
                      setInstitucion(t);
                      clearFieldError("institution");
                    }}
                    placeholder="BBVA, Banorte, Nu…"
                    placeholderTextColor="#94a3b8"
                    maxLength={40}
                    editable={!loading}
                    className={`mb-4 rounded-2xl px-4 py-3.5 font-manrope text-[15px] text-slate-900 dark:text-white ${
                      fieldErrors.institution
                        ? "bg-rose-50 dark:bg-rose-950/30"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  />
                </>
              )}

              {/* Últimos 4 dígitos (condicional) */}
              {config.showLast4 && (
                <>
                  <FieldLabel
                    text="Últimos 4 dígitos (opcional)"
                    error={fieldErrors.lastFourDigits}
                  />
                  <TextInput
                    value={last4}
                    onChangeText={(t) => {
                      setLast4(t.replace(/\D/g, "").slice(0, 4));
                      clearFieldError("lastFourDigits");
                    }}
                    placeholder="1234"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={4}
                    editable={!loading}
                    className={`mb-4 rounded-2xl px-4 py-3.5 font-manrope text-[15px] tracking-[4px] text-slate-900 dark:text-white ${
                      fieldErrors.lastFourDigits
                        ? "bg-rose-50 dark:bg-rose-950/30"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  />
                </>
              )}

              {/* Monto (saldo o límite) */}
              {(config.showOpeningBalance || config.showCreditLimit) && (
                <>
                  <FieldLabel
                    text={config.amountLabel}
                    error={
                      fieldErrors.creditLimit ?? fieldErrors.openingBalance
                    }
                  />
                  <View
                    className={`mb-5 flex-row items-center rounded-2xl px-4 py-3.5 ${
                      fieldErrors.creditLimit || fieldErrors.openingBalance
                        ? "bg-rose-50 dark:bg-rose-950/30"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    <Text className="mr-2 font-manrope-bold text-[16px] text-slate-400">
                      $
                    </Text>
                    <TextInput
                      value={monto}
                      onChangeText={(t) => {
                        setMonto(t.replace(/[^0-9.,]/g, ""));
                        clearFieldError("creditLimit");
                        clearFieldError("openingBalance");
                      }}
                      placeholder={config.amountPlaceholder}
                      placeholderTextColor="#94a3b8"
                      keyboardType="decimal-pad"
                      editable={!loading}
                      className="flex-1 font-manrope text-[15px] text-slate-900 dark:text-white"
                    />
                  </View>
                </>
              )}

              <Text className="mb-2 font-manrope-medium text-[12px] text-slate-500">Color de la cuenta</Text>
              <View className="mb-4 flex-row flex-wrap gap-3">
                {["#10b981", "#0ea5e9", "#6366f1", "#f43f5e", "#f59e0b", "#64748b"].map(item => (
                  <Pressable key={item} onPress={() => setColorCuenta(item)} disabled={loading}
                    accessibilityLabel={`Elegir color ${item}`}
                    style={{ backgroundColor: item }}
                    className="h-9 w-9 items-center justify-center rounded-full">
                    {colorCuenta === item && <SymbolView name={{ android: "check", web: "check" }} size={19} tintColor="#fff" />}
                  </Pressable>
                ))}
              </View>

              <Pressable onPress={() => {
                if (editing?.isDefault && esPrincipal) {
                  Alert.alert("Cuenta principal", "Primero establece otra cuenta como principal si deseas cambiarla.");
                  return;
                }
                setEsPrincipal(value => !value);
              }} disabled={loading}
                className="mb-3 flex-row items-center justify-between rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
                <Text className="font-manrope-medium text-[13px] text-slate-900 dark:text-white">Cuenta principal</Text>
                <SymbolView name={{ android: esPrincipal ? "check_circle" : "radio_button_unchecked", web: esPrincipal ? "check_circle" : "radio_button_unchecked" }} size={22} tintColor={esPrincipal ? "#10b981" : "#94a3b8"} />
              </Pressable>
              <Pressable onPress={() => setIncluirPatrimonio(value => !value)} disabled={loading}
                className="mb-4 flex-row items-center justify-between rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
                <Text className="font-manrope-medium text-[13px] text-slate-900 dark:text-white">Incluir en patrimonio</Text>
                <SymbolView name={{ android: incluirPatrimonio ? "check_circle" : "radio_button_unchecked", web: incluirPatrimonio ? "check_circle" : "radio_button_unchecked" }} size={22} tintColor={incluirPatrimonio ? "#10b981" : "#94a3b8"} />
              </Pressable>

              {/* Error general */}
              {serverError && (
                <View className="mb-4 flex-row items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 dark:bg-rose-950/30">
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

              <Pressable
                onPress={handleCrear}
                disabled={deshabilitado}
                className={`items-center rounded-2xl bg-slate-900 py-4 dark:bg-white ${
                  deshabilitado ? "opacity-30" : ""
                }`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-manrope-bold text-[15px] text-white dark:text-slate-900">
                    {editing ? "Guardar cambios" : "Crear cuenta"}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// Label con error inline
// ═══════════════════════════════════════════════════════════════
function FieldLabel({ text, error }: { text: string; error?: string }) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="font-manrope-medium text-[12px] text-slate-500">
        {text}
      </Text>
      {error && (
        <Text className="font-manrope text-[11px] text-rose-500">{error}</Text>
      )}
    </View>
  );
}
