// app/_layout.tsx
import { useColorScheme } from "@/components/useColorScheme";
import { AppThemeProvider, useAppTheme } from "@/context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useFonts } from "expo-font";
import {
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient, QueryAppStateManager } from "@/lib/queryClient";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";
export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Manrope-ExtraLight": Manrope_200ExtraLight,
    "Manrope-Light": Manrope_300Light,
    Manrope: Manrope_400Regular,
    "Manrope-Medium": Manrope_500Medium,
    "Manrope-SemiBold": Manrope_600SemiBold,
    "Manrope-Bold": Manrope_700Bold,
    "Manrope-ExtraBold": Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <QueryAppStateManager />
        <AppThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </AppThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isReady: themeReady } = useAppTheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (themeReady) void SplashScreen.hideAsync();
  }, [themeReady]);

  useEffect(() => {
    if (isLoading || !themeReady) return;

    // El grupo "(auth)" es el que contiene Login y Register
    const enAuth = segments[0] === "(auth)";

    if (!user && !enAuth) {
      router.replace("/(auth)/Login");
    } else if (user && enAuth) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, themeReady, segments, router]);

  if (!themeReady) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* El grupo (auth) contiene Login y Register */}
        <Stack.Screen name="(auth)" />

        {/* Las tabs */}
        <Stack.Screen name="(tabs)" />

        {/* Resto de rutas */}
        <Stack.Screen name="onboarding/telegram" />
        <Stack.Screen name="settings/telegram" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="accounts-archived" />
        <Stack.Screen name="planning" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
