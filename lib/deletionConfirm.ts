import { Alert } from "react-native";
import { ApiError } from "@/lib/api";
import type { DeletionRequest } from "@/hooks/mutations/useFinanceMutations";

function confirmationDetails(error: unknown): Record<string, string> | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const body = error.body as { errors?: Record<string, string> } | null;
  return body?.errors?.requiresConfirmation === "true" ? body.errors : null;
}

export function confirmAccountDeletion(
  name: string,
  execute: (request: DeletionRequest) => Promise<unknown>,
  id: string,
): void {
  const remove = async (force = false) => {
    try {
      await execute({ id, force });
      Alert.alert("Cuenta eliminada", `«${name}» ya no existe en la base de datos.`);
    } catch (error) {
      const linked = confirmationDetails(error);
      if (linked && !force) {
        Alert.alert(
          "Eliminar también movimientos",
          `La cuenta «${name}» tiene ${linked.transactions} movimiento(s), incluidos los anulados. Para borrarla de PostgreSQL se eliminarán PERMANENTEMENTE esos movimientos y los pagos o apartados asociados. Los saldos de otras cuentas pueden cambiar. No se podrá deshacer.`,
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar todo", style: "destructive", onPress: () => { void remove(true); } },
          ],
        );
        return;
      }
      Alert.alert("No se pudo eliminar", error instanceof Error ? error.message : "Intenta nuevamente.");
    }
  };

  Alert.alert(
    "Eliminar cuenta definitivamente",
    `¿Eliminar «${name}» de la base de datos? Esta operación es irreversible. Si hay movimientos asociados, te pediremos otra confirmación.`,
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => { void remove(); } },
    ],
  );
}

export function confirmCategoryDeletion(
  name: string,
  execute: (request: DeletionRequest) => Promise<unknown>,
  id: string,
): void {
  const remove = async (force = false) => {
    try {
      await execute({ id, force });
      Alert.alert("Categoría eliminada", `«${name}» ya no existe en la base de datos.`);
    } catch (error) {
      const linked = confirmationDetails(error);
      if (linked && !force) {
        Alert.alert(
          "La categoría tiene datos asociados",
          `Se conservarán ${linked.movements} movimiento(s), pero quedarán sin categoría. Se borrarán ${linked.budgets} presupuesto(s) y ${linked.splits} desglose(s). Las subcategorías quedarán independientes. No se puede deshacer.`,
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar y desvincular", style: "destructive", onPress: () => { void remove(true); } },
          ],
        );
        return;
      }
      Alert.alert("No se pudo eliminar", error instanceof Error ? error.message : "Intenta nuevamente.");
    }
  };

  Alert.alert(
    "Eliminar categoría definitivamente",
    `¿Eliminar «${name}» de PostgreSQL? Si tiene relaciones, será necesaria una segunda confirmación.`,
    [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => { void remove(); } },
    ],
  );
}
