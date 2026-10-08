import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme } from "nativewind";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const THEME_STORAGE_KEY = "finanzas:appearance:v1";

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isReady: boolean;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function validPreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (alive && validPreference(saved)) setPreferenceState(saved);
      })
      .catch(() => {
        // Si falla el almacenamiento, seguimos con el tema del dispositivo.
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => { alive = false; };
  }, []);

  const resolvedTheme: ResolvedTheme = preference === "system"
    ? (systemScheme === "dark" ? "dark" : "light")
    : preference;

  // Sincroniza los estilos dark: de NativeWind con la preferencia elegida.
  useEffect(() => {
    if (!isReady) return;
    colorScheme.set(preference);
  }, [preference, isReady]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    colorScheme.set(value);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, value).catch(() => {
      // El cambio actual funciona aunque no se pueda guardar para otro inicio.
    });
  }, []);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, isReady, setPreference }),
    [preference, resolvedTheme, isReady, setPreference],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme requiere AppThemeProvider");
  return context;
}
