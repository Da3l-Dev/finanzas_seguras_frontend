import { useColorScheme } from "@/components/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { Tabs, router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import "../../global.css";

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  const colorScheme = useColorScheme();

  // Guard de auth: en useEffect, jamás en el render
  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/(auth)/Login");
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  if (!user) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                android: "home",
                web: "home",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Movimientos",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                android: "payments",
                web: "payments",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: "Cuentas",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "chevron.left.forwardslash.chevron.right",
                android: "account_balance_wallet",
                web: "account_balance_wallet",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "chevron.left.forwardslash.chevron.right",
                android: "person",
                web: "person",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
