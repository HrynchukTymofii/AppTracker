import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight, LucideIcon } from "lucide-react-native";

interface SettingsItemProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  isDark: boolean;
  color?: string;
  bgColor?: string;
}

export const SettingsItem = ({
  icon: Icon,
  label,
  onPress,
  isDark,
  color,
  bgColor,
}: SettingsItemProps) => {
  const textColor = color || (isDark ? "#ffffff" : "#111827");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: bgColor || (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"),
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: textColor === "#ef4444"
            ? "rgba(239, 68, 68, 0.15)"
            : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 14,
        }}
      >
        <Icon size={22} color={textColor} strokeWidth={2} />
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: 16,
          fontWeight: "600",
          color: textColor,
        }}
      >
        {label}
      </Text>
      <ChevronRight size={22} color={isDark ? "#6b7280" : "#9ca3af"} />
    </TouchableOpacity>
  );
};
