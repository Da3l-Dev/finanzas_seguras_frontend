import Constants from "expo-constants";

// 🔧 Resuelve la URL de la API automáticamente
function resolveApiUrl(): string {
  // 1. Si hay variable de entorno, úsala
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // 2. Si estamos en dev con Expo, usa la misma IP que sirve el bundler
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3000`;
  }

  // 3. Fallback
  return "http://localhost:3000";
}

export const API_URL = resolveApiUrl();

// 🕒 Fetch con timeout
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// 🚀 Cliente con manejo de errores consistente
export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(url, { ...init, headers });
  } catch (e: unknown) {
    const err = e as Error;
    if (err.name === "AbortError") {
      throw new ApiError(0, `Timeout conectando a ${url}`, null);
    }
    throw new ApiError(0, `No se pudo conectar a ${url}: ${err.message}`, null);
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      (body as { message?: string } | null)?.message ??
      `Error HTTP ${res.status}`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}
