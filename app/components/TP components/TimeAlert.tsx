import { View, Text } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TimeAlert() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{
        backgroundColor: isDark ? "#450a0a" : "#fee2e2",
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: "#ef4444",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <AlertTriangle size={20} color="#ef4444" />
        <Text
          style={{
            fontWeight: "600",
            color: "#ef4444",
            fontSize: 14,
          }}
        >
          Less than 5 minutes remaining!
        </Text>
      </View>
    </View>
  );
}
