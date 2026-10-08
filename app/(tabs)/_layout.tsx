import { useColorScheme } from "@/components/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs, router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../../global.css";

// La barra inferior conserva las rutas originales y muestra las cuatro
// secciones principales del diseño. Movimientos sigue accesible desde Inicio.
export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const scheme = useColorScheme();
  const darkBar = scheme === "dark";
  const insets = useSafeAreaInsets();
  // Reservamos espacio para los botones o la barra de gestos de Android.
  const bottomInset = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 12 : 8,
  );

  useEffect(() => {
    if (!isLoading && !user) router.replace("/(auth)/Login");
  }, [isLoading, user]);

  if (isLoading || !user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: darkBar ? "#3DE0A2" : "#07866D",
        tabBarInactiveTintColor: darkBar ? "#99A5B4" : "#64748B",
        tabBarStyle: {
          backgroundColor: darkBar ? "#0D1217" : "#FFFFFF",
          borderTopColor: darkBar ? "#25303A" : "#E2E8F0",
          borderTopWidth: 1,
          height: 58 + bottomInset,
          paddingTop: 7,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: {
          fontFamily: "Manrope-Medium",
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-variant-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Cuentas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="credit-card-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Estadísticas",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="chart-bar"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen name="movements" options={{ href: null }} />
    </Tabs>
  );
}
