import type { Cuenta, CuentaTipo } from "@/app/data/types/cuentas";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCrear: (cuenta: Cuenta) => void;
};

// Tipos de cuenta con su icono
const TIPOS: { value: CuentaTipo; label: string; icon: any }[] = [
  {
    value: "CASH",
    label: "Efectivo",
    icon: { android: "payments", web: "payments" },
  },
  {
    value: "DEBIT_CARD",
    label: "Débito",
    icon: { android: "credit_card", web: "credit_card" },
  },
  {
    value: "CREDIT_CARD",
    label: "Crédito",
    icon: { android: "credit_card", web: "credit_card" },
  },
  {
    value: "SAVINGS",
    label: "Ahorro",
    icon: { android: "savings", web: "savings" },
  },
];

export default function ModalNewAccount({ visible, onClose, onCrear }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipoSel, setTipoSel] = useState<CuentaTipo>("CASH");

  const reset = () => {
    setNombre("");
    setTipoSel("CASH");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCrear = () => {
    if (nombre.trim().length < 2) return;
    const tipoData = TIPOS.find((t) => t.value === tipoSel)!;
    onCrear({
      id: `a-${Date.now()}`,
      name: nombre.trim(),
      type: tipoSel,
      icon: tipoData.icon,
    });
    reset();
  };

  const deshabilitado = nombre.trim().length < 2;

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
            className="rounded-t-[28px] bg-white p-6 dark:bg-[#0f172a]"
          >
            <View className="mb-4 items-center">
              <View className="h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
            </View>

            <Text className="mb-1 font-manrope-bold text-[18px] text-slate-900 dark:text-white">
              Nueva cuenta
            </Text>
            <Text className="mb-5 font-manrope text-[13px] text-slate-500">
              ¿Cómo le vas a llamar?
            </Text>

            {/* Nombre */}
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Nómina BBVA, Efectivo…"
              placeholderTextColor="#94a3b8"
              maxLength={30}
              autoFocus
              className="mb-5 rounded-2xl bg-slate-100 px-4 py-3.5 font-manrope text-[15px] text-slate-900 dark:bg-slate-800 dark:text-white"
            />

            {/* Tipo de cuenta */}
            <Text className="mb-2 font-manrope-medium text-[12px] text-slate-500">
              Tipo
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {TIPOS.map((t) => {
                const activa = tipoSel === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setTipoSel(t.value)}
                    className={`flex-row items-center gap-2 rounded-full px-4 py-2.5 ${
                      activa
                        ? "bg-slate-900 dark:bg-white"
                        : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    <SymbolView
                      name={t.icon}
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

            <Pressable
              onPress={handleCrear}
              disabled={deshabilitado}
              className={`items-center rounded-2xl bg-slate-900 py-4 dark:bg-white ${
                deshabilitado ? "opacity-30" : ""
              }`}
            >
              <Text className="font-manrope-bold text-[15px] text-white dark:text-slate-900">
                Crear cuenta
              </Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
