import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { focusManager, QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";

// Las consultas financieras caducan pronto; las mutaciones nunca se reintentan solas.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failures, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failures < 2,
      refetchOnReconnect: true,
      refetchInterval: 60_000, // Sincroniza datos generados por el bot mientras la aplicación está abierta.
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

// En Android/iOS el foco depende de AppState, no de la ventana del navegador.
export function QueryAppStateManager() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const subscription = AppState.addEventListener("change", (state) => {
      focusManager.setFocused(state === "active");
      if (state === "active") {
        for (const key of ["accounts", "transactions", "summary", "stats", "accountAnalytics", "categories", "budgets", "goals", "profile"]) {
          void queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    });
    return () => {
      subscription.remove();
      focusManager.setFocused(undefined);
    };
  }, []);
  return null;
}
