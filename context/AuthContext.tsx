import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_URL, ApiError, apiFetch } from "../lib/api";

// ================== Tipos ==================

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
};

export type SignUpData = {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName: string;
};

// 👇 Coincide con la forma REAL de tu backend
type ApiEnvelope<T> = {
  status: "ok" | "error";
  message: string;
  data?: T;
  errors?: unknown;
};

type LoginPayload = {
  user: User;
  token: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
};

// ================== Context ==================

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---------- Restaurar sesión ----------
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User);
        }
      } catch (e) {
        console.warn("[Auth] Error restaurando sesión:", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ---------- Persistir ----------
  const persistSession = useCallback(
    async (newToken: string, newUser: User) => {
      setToken(newToken);
      setUser(newUser);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, newToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser)),
      ]);
    },
    [],
  );

  // ---------- Helper para desempaquetar el envelope ----------
  const unwrap = (res: ApiEnvelope<LoginPayload>): LoginPayload => {
    if (res.status !== "ok" || !res.data) {
      throw new Error(res.message || "Respuesta inválida del servidor");
    }
    if (!res.data.token) {
      throw new Error("El servidor no devolvió token. Revisa el backend.");
    }
    if (!res.data.user) {
      throw new Error("El servidor no devolvió el usuario.");
    }
    return res.data;
  };

  // ---------- Login ----------
  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await apiFetch<ApiEnvelope<LoginPayload>>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const { user: u, token: t } = unwrap(res);
      await persistSession(t, u);
    },
    [persistSession],
  );

  // ---------- Registro ----------
  const signUp = useCallback(
    async (payload: SignUpData) => {
      const res = await apiFetch<ApiEnvelope<LoginPayload>>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      const { user: u, token: t } = unwrap(res);
      await persistSession(t, u);
    },
    [persistSession],
  );

  // ---------- Logout ----------
  const signOut = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" }, token);
    } catch (e) {
      if (!(e instanceof ApiError)) {
        console.warn("[Auth] Error en logout remoto:", e);
      }
    }
    setUser(null);
    setToken(null);
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
  }, [token]);

  const value = useMemo(
    () => ({ user, token, isLoading, signIn, signUp, signOut }),
    [user, token, isLoading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export { API_URL };
