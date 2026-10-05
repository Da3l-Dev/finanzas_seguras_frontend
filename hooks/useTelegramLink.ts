import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";

type StatusData = {
  linked: boolean;
  username?: string | null;
  firstName?: string | null;
  linkedAt?: string;
};

type LinkData = {
  telegramUrl: string;
  expiresAt: string;
};

type Envelope<T> = {
  status: "ok" | "error";
  message?: string;
  data?: T;
};

export function useTelegramLink() {
  const { token } = useAuth();
  const [status, setStatus] = useState<StatusData>({ linked: false });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [linking, setLinking] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiFetch<Envelope<StatusData>>(
        "/api/telegram/status",
        { method: "GET" },
        token,
      );
      if (res.data) setStatus(res.data);
    } catch (e) {
      console.warn("[Telegram] status:", e);
    } finally {
      setLoadingStatus(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling mientras hay un intento pendiente
  useEffect(() => {
    if (!pendingUrl || status.linked) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    pollRef.current = setInterval(refresh, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pendingUrl, status.linked, refresh]);

  // Cuando se vincula, limpiamos el pendiente
  useEffect(() => {
    if (status.linked) setPendingUrl(null);
  }, [status.linked]);

  const generateLink = useCallback(async () => {
    if (!token) return null;
    setLinking(true);
    try {
      const res = await apiFetch<Envelope<LinkData>>(
        "/api/telegram/link",
        { method: "POST" },
        token,
      );
      if (res.status === "error" || !res.data) {
        throw new Error(res.message ?? "No se pudo generar el enlace");
      }
      setPendingUrl(res.data.telegramUrl);
      return res.data.telegramUrl;
    } finally {
      setLinking(false);
    }
  }, [token]);

  const unlink = useCallback(async () => {
    if (!token) return;
    setUnlinking(true);
    try {
      await apiFetch("/api/telegram/unlink", { method: "POST" }, token);
      setStatus({ linked: false });
      setPendingUrl(null);
    } finally {
      setUnlinking(false);
    }
  }, [token]);

  return {
    status,
    loadingStatus,
    linking,
    unlinking,
    pendingUrl,
    generateLink,
    unlink,
    refresh,
    cancelPending: () => setPendingUrl(null),
  };
}
