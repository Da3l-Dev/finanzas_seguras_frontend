import type { Categoria } from "@/app/data/types/categorias";
import { categorias as categoriasIniciales } from "@/app/data/types/categorias";
import type { Cuenta } from "@/app/data/types/cuentas";
import { cuentas as cuentasIniciales } from "@/app/data/types/cuentas";
import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
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
import ModalNewAccount from "./modalNewAccount";
import ModalNewCategory from "./modalNewCategory";

type Props = {
  modalVisible: boolean;
  onClose: () => void;
};

type TipoTransaccion = "EXPENSE" | "INCOME";

export default function ModalCreateFinances({ modalVisible, onClose }: Props) {
  const [tipo, setTipo] = useState<TipoTransaccion>("EXPENSE");
  const [monto, setMonto] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [cuentaId, setCuentaId] = useState<string | null>(
    cuentasIniciales[0]?.id ?? null,
  );
  const [nota, setNota] = useState("");

  const [categorias, setCategorias] =
    useState<Categoria[]>(categoriasIniciales);
  const [cuentas, setCuentas] = useState<Cuenta[]>(cuentasIniciales);

  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false);
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);

  const categoriasFiltradas = useMemo(
    () => categorias.filter((c) => c.type === tipo),
    [categorias, tipo],
  );

  const esIngreso = tipo === "INCOME";
  const accentBg = esIngreso ? "bg-emerald-500" : "bg-rose-500";
  const accentText = esIngreso ? "text-emerald-500" : "text-rose-500";

  const resetForm = () => {
    setTipo("EXPENSE");
    setMonto("");
    setCategoriaId(null);
    setCuentaId(cuentas[0]?.id ?? null);
    setNota("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGuardar = () => {
    const payload = {
      type: tipo,
      amount: Number(monto),
      categoryId: categoriaId,
      sourceAccountId: cuentaId,
      description: nota,
      occurredAt: new Date().toISOString(),
      origin: "MOBILE",
    };
    console.log("Guardar transacción:", payload);
    handleClose();
  };

  const handleCrearCategoria = (nueva: Categoria) => {
    setCategorias((prev) => [...prev, nueva]);
    setCategoriaId(nueva.id);
    setShowNuevaCategoria(false);
  };

  const handleCrearCuenta = (nueva: Cuenta) => {
    setCuentas((prev) => [...prev, nueva]);
    setCuentaId(nueva.id);
    setShowNuevaCuenta(false);
  };

  const guardarDeshabilitado = !monto || Number(monto) <= 0 || !categoriaId;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={modalVisible}
      onRequestClose={handleClose}
    >
      {/* KeyboardAvoidingView es el root con el fondo overlay */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/40"
      >
        {/* Zona de arriba: toca para cerrar */}
        <Pressable className="flex-1" onPress={handleClose} />

        {/* Sheet pegado al fondo, sin wrappers extra */}
        <SafeAreaView
          edges={["bottom"]}
          className="rounded-t-[28px] bg-white dark:bg-[#0f172a]"
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-1">
            <View className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Tabs Gasto / Ingreso */}
            <View className="mt-4 flex-row px-6">
              {(["EXPENSE", "INCOME"] as TipoTransaccion[]).map((op) => {
                const activo = tipo === op;
                const label = op === "EXPENSE" ? "Gasto" : "Ingreso";
                const underline =
                  op === "EXPENSE" ? "bg-rose-500" : "bg-emerald-500";
                return (
                  <Pressable
                    key={op}
                    onPress={() => {
                      setTipo(op);
                      setCategoriaId(null);
                    }}
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

            {/* Monto hero */}
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
                  className={`ml-2 font-manrope-bold text-[56px] leading-[64px] ${accentText}`}
                  style={{ minWidth: 80 }}
                />
              </View>
            </View>

            {/* CATEGORÍA */}
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
                  <SymbolView
                    name={{ android: "add", web: "add" }}
                    size={14}
                    tintColor="#10b981"
                  />
                  <Text className="font-manrope-bold text-[12px] text-emerald-500">
                    Nueva
                  </Text>
                </Pressable>
              </View>

              {categoriasFiltradas.length === 0 ? (
                <View className="mx-6 items-center rounded-2xl bg-slate-50 py-6 dark:bg-slate-800/50">
                  <SymbolView
                    name={{ android: "category", web: "category" }}
                    size={28}
                    tintColor="#94a3b8"
                  />
                  <Text className="mt-2 font-manrope-bold text-[13px] text-slate-700 dark:text-slate-200">
                    Sin categorías de {esIngreso ? "ingreso" : "gasto"}
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
                  {categoriasFiltradas.map((cat) => {
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
                          <SymbolView
                            name={cat.icon}
                            size={22}
                            tintColor={activa ? "#ffffff" : "#64748b"}
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
                      <SymbolView
                        name={{ android: "add", web: "add" }}
                        size={22}
                        tintColor="#94a3b8"
                      />
                    </View>
                    <Text className="mt-2 w-16 text-center text-[11px] font-manrope text-slate-400">
                      Nueva
                    </Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>

            {/* CUENTA */}
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
                  <SymbolView
                    name={{ android: "add", web: "add" }}
                    size={14}
                    tintColor="#10b981"
                  />
                  <Text className="font-manrope-bold text-[12px] text-emerald-500">
                    Nueva
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}
              >
                {cuentas.map((cuenta) => {
                  const activa = cuentaId === cuenta.id;
                  return (
                    <Pressable
                      key={cuenta.id}
                      onPress={() => setCuentaId(cuenta.id)}
                      className={`flex-row items-center gap-2 rounded-full px-3 py-2 ${
                        activa
                          ? "bg-slate-900 dark:bg-white"
                          : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      <SymbolView
                        name={cuenta.icon}
                        size={14}
                        tintColor={activa ? "#fff" : "#64748b"}
                      />
                      <Text
                        className={`font-manrope text-[13px] ${
                          activa
                            ? "text-white dark:text-slate-900"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {cuenta.name}
                      </Text>
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => setShowNuevaCuenta(true)}
                  className="flex-row items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3 py-2 dark:border-slate-600"
                >
                  <SymbolView
                    name={{ android: "add", web: "add" }}
                    size={14}
                    tintColor="#94a3b8"
                  />
                  <Text className="font-manrope text-[13px] text-slate-400">
                    Nueva
                  </Text>
                </Pressable>
              </ScrollView>
            </View>

            {/* NOTA */}
            <View className="mt-6 px-6">
              <View className="flex-row items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 dark:bg-slate-800">
                <SymbolView
                  name={{ android: "edit_note", web: "edit_note" }}
                  size={18}
                  tintColor="#94a3b8"
                />
                <TextInput
                  value={nota}
                  onChangeText={setNota}
                  placeholder="Añadir nota…"
                  placeholderTextColor="#94a3b8"
                  maxLength={120}
                  className="flex-1 font-manrope text-[14px] text-slate-900 dark:text-white"
                />
              </View>
            </View>

            {/* CTA */}
            <View className="mt-5 px-6">
              <Pressable
                onPress={handleGuardar}
                disabled={guardarDeshabilitado}
                className={`items-center rounded-2xl py-4 ${accentBg} ${
                  guardarDeshabilitado ? "opacity-30" : ""
                }`}
              >
                <Text className="font-manrope-bold text-[16px] text-white">
                  Guardar {esIngreso ? "ingreso" : "gasto"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Mini modales anidados */}
      <ModalNewCategory
        visible={showNuevaCategoria}
        tipo={tipo}
        onClose={() => setShowNuevaCategoria(false)}
        onCrear={handleCrearCategoria}
      />

      <ModalNewAccount
        visible={showNuevaCuenta}
        onClose={() => setShowNuevaCuenta(false)}
        onCrear={handleCrearCuenta}
      />
    </Modal>
  );
}
