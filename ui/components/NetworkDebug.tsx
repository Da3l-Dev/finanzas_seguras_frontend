import { API_URL, fetchWithTimeout } from "@/lib/api";
import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Result = {
  name: string;
  ok: boolean;
  status?: number;
  ms: number;
  detail: string;
};

export function NetworkDebug() {
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);

  const test = useCallback(
    async (name: string, url: string, init?: RequestInit): Promise<Result> => {
      const start = Date.now();
      try {
        const res = await fetchWithTimeout(url, init, 8000);
        const text = await res.text();
        return {
          name,
          ok: res.ok,
          status: res.status,
          ms: Date.now() - start,
          detail: text.slice(0, 300) || "(sin body)",
        };
      } catch (e) {
        const err = e as Error;
        return {
          name,
          ok: false,
          ms: Date.now() - start,
          detail:
            err.name === "AbortError"
              ? "TIMEOUT (8s) — no hay respuesta del host"
              : `${err.name}: ${err.message}`,
        };
      }
    },
    [],
  );

  const runAll = useCallback(async () => {
    setRunning(true);
    setResults([]);

    const out: Result[] = [];

    out.push(await test("1. Base de la API", `${API_URL}/`));
    out.push(
      await test("2. /api/auth/login (GET)", `${API_URL}/api/auth/login`),
    );
    out.push(
      await test(
        "3. Login POST (credenciales falsas, esperamos 400/401)",
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@test.com", password: "x" }),
        },
      ),
    );
    out.push(
      await test(
        "4. Register POST (payload vacío, esperamos 400)",
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      ),
    );

    setResults(out);
    setRunning(false);
  }, [test]);

  useEffect(() => {
    runAll();
  }, [runAll]);

  const hostUri = Constants.expoConfig?.hostUri ?? "desconocido";
  const phoneHost = hostUri.split(":")[0];
  const apiHost = API_URL.replace(/^https?:\/\//, "").split(":")[0];
  const sameHost = phoneHost === apiHost;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🔍 Diagnóstico de red</Text>

      <View style={styles.infoBox}>
        <Text style={styles.info}>API_URL: {API_URL}</Text>
        <Text style={styles.info}>Expo hostUri: {hostUri}</Text>
        <Text
          style={[styles.info, { color: sameHost ? "#16a34a" : "#dc2626" }]}
        >
          {sameHost
            ? "✅ Misma IP que el bundler"
            : `⚠️ IP distinta. Bundler=${phoneHost}, API=${apiHost}`}
        </Text>
      </View>

      <Button
        title={running ? "Corriendo..." : "Volver a probar"}
        onPress={runAll}
        disabled={running}
      />

      {running && <ActivityIndicator style={{ marginTop: 16 }} />}

      {results.map((r) => (
        <View
          key={r.name}
          style={[styles.card, { borderColor: r.ok ? "#22c55e" : "#ef4444" }]}
        >
          <Text style={styles.name}>
            {r.ok ? "✅" : "❌"} {r.name}
          </Text>
          <Text style={styles.meta}>
            {r.status ? `HTTP ${r.status} · ` : ""}
            {r.ms} ms
          </Text>
          <Text style={styles.detail}>{r.detail}</Text>
        </View>
      ))}

      <View style={styles.help}>
        <Text style={styles.helpTitle}>Cómo interpretar:</Text>
        <Text style={styles.helpItem}>
          • Test 1 timeout → el teléfono no alcanza la IP. WiFi distinta,
          firewall, o IP mal.
        </Text>
        <Text style={styles.helpItem}>
          • Test 2 o 3 con 404 → la ruta no existe en tu Next.
        </Text>
        <Text style={styles.helpItem}>
          • Test 3 con 400/401 → ¡todo bien! La API responde.
        </Text>
        <Text style={styles.helpItem}>
          • Test 3 con 500 → el backend revienta. Revisa logs.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontSize: 20, fontWeight: "700" },
  infoBox: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  info: { fontSize: 13, color: "#334155" },
  card: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#fff",
  },
  name: { fontWeight: "600", marginBottom: 4, fontSize: 14 },
  meta: { fontSize: 12, color: "#475569", marginBottom: 6 },
  detail: { fontSize: 11, fontFamily: "monospace", color: "#1e293b" },
  help: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fefce8",
    borderRadius: 8,
    gap: 4,
  },
  helpTitle: { fontWeight: "700", marginBottom: 4, fontSize: 13 },
  helpItem: { fontSize: 12, color: "#422006" },
});
