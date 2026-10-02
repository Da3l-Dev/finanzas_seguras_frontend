import * as SecureStore from "expo-secure-store";
import { createContext, useContext, useEffect, useState } from "react";

// ⚙️ Ajusta a la URL de tu API
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
};

type SignUpData = {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

// 🔍 Extrae el token de un header Set-Cookie
function extractTokenFromCookie(setCookie: string | null): string | null {
  if (!setCookie) return null;
  // Busca `token=...` o `authToken=...` (ajusta el nombre según tu API)
  const match = setCookie.match(
    /(?:^|;\s*)(?:token|authToken|access_token)=([^;]+)/,
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión al abrir la app
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.warn("Error restaurando sesión:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persistSession = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, newToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser)),
    ]);
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message ?? "Credenciales incorrectas");
    }

    const setCookie = res.headers.get("set-cookie");
    const newToken = extractTokenFromCookie(setCookie);
    const data = await res.json(); // { user: {...} } o el user directo

    if (!newToken) throw new Error("El servidor no devolvió un token");

    await persistSession(newToken, data.user ?? data);
  };

  const signUp = async (payload: SignUpData) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message ?? "No se pudo crear la cuenta");
    }

    const setCookie = res.headers.get("set-cookie");
    const newToken = extractTokenFromCookie(setCookie);
    const data = await res.json();

    if (!newToken) throw new Error("El servidor no devolvió un token");

    await persistSession(newToken, data.user ?? data);
  };

  const signOut = async () => {
    // Notifica al backend (opcional)
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: token ? { Cookie: `token=${token}` } : {},
      });
    } catch {}
    setUser(null);
    setToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
