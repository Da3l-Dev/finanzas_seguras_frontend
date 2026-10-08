import { ApiError, apiFetch } from "@/lib/api";

// El backend todavía combina los contratos success y status.
export type ApiEnvelope<T> =
  | { success: boolean; message?: string; data?: T; errors?: unknown }
  | { status: "ok" | "error"; message?: string; data?: T; errors?: unknown };

export async function queryFetch<T>(path: string, token: string): Promise<T> {
  const response = await apiFetch<ApiEnvelope<T>>(path, { method: "GET" }, token);
  if (!response || typeof response !== "object") {
    throw new ApiError(0, "Respuesta inválida del servidor.", response);
  }
  const success = "success" in response ? response.success === true : response.status === "ok";
  if (!success) {
    throw new ApiError(400, response.message || "No fue posible obtener los datos.", response);
  }
  if (response.data === undefined || response.data === null) {
    throw new ApiError(0, "El servidor no devolvió los datos esperados.", response);
  }
  return response.data;
}

export function buildQueryString(filters: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.append(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getQueryErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Ocurrió un error inesperado.";
}

// Transforma errores Zod y objetos de campos en mensajes para los formularios.
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const payload = error.body as { errors?: unknown } | null;
  const errors = payload?.errors;
  if (Array.isArray(errors)) {
    const result: Record<string, string> = {};
    for (const issue of errors) {
      const key = String(issue?.path?.[0] ?? "general");
      if (!result[key]) result[key] = String(issue?.message ?? "Dato no válido.");
    }
    return result;
  }
  if (errors && typeof errors === "object") {
    return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? String(v[0] ?? "") : String(v)]));
  }
  return {};
}
