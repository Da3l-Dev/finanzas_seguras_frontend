import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// ═══════════════════════════════════════════════════════════════
// Type helper: nombres válidos de MaterialCommunityIcons
// ═══════════════════════════════════════════════════════════════
export type MCIconName = keyof typeof MaterialCommunityIcons.glyphMap;

const GLYPH_MAP = MaterialCommunityIcons.glyphMap as Record<string, number>;

export function isValidIcon(name: string): name is MCIconName {
  return Object.prototype.hasOwnProperty.call(GLYPH_MAP, name);
}

// ═══════════════════════════════════════════════════════════════
// Alias: nombres viejos/raros → nombre real de MCI
// ═══════════════════════════════════════════════════════════════
export const ICON_ALIASES: Record<string, MCIconName> = {
  // FontAwesome / otros sets
  utensils: "silverware-fork-knife",
  "utensils-alt": "silverware-fork-knife",
  "gas-pump": "gas-station",
  "car-side": "car",
  "shopping-bag": "shopping",
  "shopping-basket": "basket",
  "tshirt-alt": "tshirt-crew",
  house: "home",
  "heart-beat": "heart-pulse",
  medkit: "medical-bag",
  "user-md": "doctor",
  "graduation-cap": "school",
  gamepad: "gamepad-variant",
  film: "movie",
  money: "cash",
  "money-bill": "cash",
  wallet: "wallet",
  "chart-line": "chart-line",
  "chart-bar": "chart-bar",

  // SF Symbols → MCI
  add: "plus",
  error: "alert-circle",
  warning: "alert",
  edit_note: "note-edit",
  payments: "cash",
  credit_card: "credit-card",
  account_balance_wallet: "wallet",
  restaurant: "food",
  shopping_cart: "cart",
  local_gas_station: "gas-station",
  directions_car: "car",
  medical_services: "medical-bag",
  pets: "paw",
  fitness_center: "dumbbell",
  laptop_mac: "laptop",
  replay: "backup-restore",
  card_giftcard: "gift",
  trending_up: "trending-up",
  savings: "piggy-bank",
  category: "shape",
  person: "account",
  send: "send",
  logout: "logout",
  chevron_right: "chevron-right",
  arrow_back: "arrow-left",
  visibility: "eye",
  visibility_off: "eye-off",
  badge: "card-account-details",
  alternate_email: "at",
  mail: "email",
  lock: "lock",
  phone: "phone",
  calendar_today: "calendar",
  receipt_long: "receipt",
  error_outline: "alert-circle-outline",
  info: "information",
  check: "check",
  close: "close",
};

// ═══════════════════════════════════════════════════════════════
// Normalizador: cualquier entrada → nombre válido de MCI
// ═══════════════════════════════════════════════════════════════
const FALLBACK_ICON: MCIconName = "shape";

export function toIconName(
  raw: unknown,
  fallback: MCIconName = FALLBACK_ICON,
): MCIconName {
  if (!raw) return fallback;

  let candidate = "";

  // JSON string o objeto { android, web }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as { android?: string; web?: string };
    candidate = obj.android ?? obj.web ?? "";
  } else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        candidate =
          (parsed as { android?: string }).android ??
          (parsed as { web?: string }).web ??
          "";
      } else {
        candidate = raw;
      }
    } catch {
      candidate = raw;
    }
  }

  candidate = candidate.trim();
  if (!candidate) return fallback;

  // 1) Alias directo
  const aliased = ICON_ALIASES[candidate];
  if (aliased && isValidIcon(aliased)) return aliased;

  // 2) Nombre tal cual
  if (isValidIcon(candidate)) return candidate;

  // 3) Con guiones en vez de guiones bajos
  const dashed = candidate.replace(/_/g, "-");
  if (isValidIcon(dashed)) return dashed;

  // 4) Fallback
  return fallback;
}

// ═══════════════════════════════════════════════════════════════
// Iconos por defecto por tipo (para formularios, chips, etc.)
// ═══════════════════════════════════════════════════════════════
export const ACCOUNT_TYPE_ICONS: Record<string, MCIconName> = {
  CASH: "cash",
  DEBIT_CARD: "credit-card",
  CREDIT_CARD: "credit-card-outline",
  SAVINGS: "piggy-bank",
  INVESTMENT: "chart-line",
};

export const CATEGORY_TYPE_ICONS: Record<string, MCIconName> = {
  EXPENSE: "cart",
  INCOME: "cash-plus",
};

// Iconos disponibles para el selector de crear categoría
export const SUGGESTED_EXPENSE_ICONS: MCIconName[] = [
  "silverware-fork-knife",
  "food",
  "coffee",
  "cart",
  "basket",
  "gas-station",
  "car",
  "bus",
  "bike",
  "airplane",
  "train",
  "home",
  "lightbulb",
  "water",
  "fire",
  "flash",
  "wifi",
  "cellphone",
  "laptop",
  "medical-bag",
  "pill",
  "hospital-box",
  "heart",
  "dumbbell",
  "school",
  "movie",
  "music",
  "gamepad-variant",
  "tshirt-crew",
  "shoe-sneaker",
  "paw",
  "dog",
  "cat",
  "flower",
  "glass-mug-variant",
  "glass-cocktail",
  "tools",
  "gift",
  "baby-carriage",
  "package-variant",
  "cash-remove",
];

export const SUGGESTED_INCOME_ICONS: MCIconName[] = [
  "cash",
  "cash-multiple",
  "cash-plus",
  "wallet",
  "bank",
  "briefcase",
  "laptop",
  "chart-line",
  "chart-bar",
  "trending-up",
  "gift",
  "hand-coin",
  "piggy-bank",
  "sack",
  "diamond-stone",
  "currency-usd",
  "currency-eur",
  "credit-card-plus",
  "account-cash",
  "sale",
  "store",
  "cart-plus",
];

// Catálogo completo para el buscador del modal
export const ALL_MCI_ICONS: MCIconName[] = Object.keys(
  GLYPH_MAP,
) as MCIconName[];
