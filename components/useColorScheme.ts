import { useAppTheme } from "@/context/ThemeContext";

// Misma apariencia para pantallas y navegación, no solo para el sistema.
export function useColorScheme() {
  return useAppTheme().resolvedTheme;
}
