import type { Categoria, CategoriaTipo } from "@/app/data/types/categorias";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  tipo: CategoriaTipo;
  onClose: () => void;
  onCrear: (categoria: Categoria) => void;
};

// Iconos sugeridos: cambian según el tipo
const ICONOS_EXPENSE = [
  { android: "restaurant", web: "restaurant" },
  { android: "shopping_cart", web: "shopping_cart" },
  { android: "local_gas_station", web: "local_gas_station" },
  { android: "home", web: "home" },
  { android: "directions_car", web: "directions_car" },
  { android: "movie", web: "movie" },
  { android: "medical_services", web: "medical_services" },
  { android: "pets", web: "pets" },
  { android: "fitness_center", web: "fitness_center" },
  { android: "school", web: "school" },
] as const;

const ICONOS_INCOME = [
  { android: "work", web: "work" },
  { android: "laptop_mac", web: "laptop_mac" },
  { android: "replay", web: "replay" },
  { android: "card_giftcard", web: "card_giftcard" },
  { android: "trending_up", web: "trending_up" },
  { android: "savings", web: "savings" },
] as const;

export default function ModalNewCategory({
  visible,
  tipo,
  onClose,
  onCrear,
}: Props) {
  const [nombre, setNombre] = useState("");
  const [iconoIdx, setIconoIdx] = useState(0);

  const iconos = tipo === "INCOME" ? ICONOS_INCOME : ICONOS_EXPENSE;
  const accentBg = tipo === "INCOME" ? "bg-emerald-500" : "bg-rose-500";

  const reset = () => {
    setNombre("");
    setIconoIdx(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCrear = () => {
    if (nombre.trim().length < 2) return;
    onCrear({
      id: `c-${Date.now()}`,
      name: nombre.trim(),
      icon: iconos[iconoIdx],
      type: tipo,
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
              Nueva categoría
            </Text>
            <Text className="mb-5 font-manrope text-[13px] text-slate-500">
              Ponle un nombre y elige un icono
            </Text>

            {/* Nombre */}
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Café, Gym, Mascotas…"
              placeholderTextColor="#94a3b8"
              maxLength={30}
              autoFocus
              className="mb-5 rounded-2xl bg-slate-100 px-4 py-3.5 font-manrope text-[15px] text-slate-900 dark:bg-slate-800 dark:text-white"
            />

            {/* Iconos */}
            <Text className="mb-2 font-manrope-medium text-[12px] text-slate-500">
              Icono
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              className="mb-6"
            >
              {iconos.map((ic, i) => {
                const activo = iconoIdx === i;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setIconoIdx(i)}
                    className={`h-12 w-12 items-center justify-center rounded-full ${
                      activo ? accentBg : "bg-slate-100 dark:bg-slate-800"
                    }`}
                  >
                    <SymbolView
                      name={ic}
                      size={20}
                      tintColor={activo ? "#fff" : "#64748b"}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={handleCrear}
              disabled={deshabilitado}
              className={`items-center rounded-2xl py-4 ${accentBg} ${
                deshabilitado ? "opacity-30" : ""
              }`}
            >
              <Text className="font-manrope-bold text-[15px] text-white">
                Crear categoría
              </Text>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
