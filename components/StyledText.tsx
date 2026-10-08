import { Platform } from "react-native";
import { Text, type TextProps } from "./Themed";

// Usa la fuente monoespaciada del sistema, sin archivos externos.
export function MonoText(props: TextProps) {
  return (
    <Text
      {...props}
      style={[props.style, { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }]}
    />
  );
}
