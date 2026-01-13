import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

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
}: SettingsItemProps) => {
  const textColor = color || (isDark ? "#ffffff" : "#111827");

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        borderRadius: 18,
        marginBottom: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
      }}
    >
      <BlurView intensity={isDark ? 20 : 35} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={isDark ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"] : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={isDark ? ["rgba(255, 255, 255, 0.06)", "transparent"] : ["rgba(255, 255, 255, 0.4)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { height: "60%" }]}
      />
      <View style={{ padding: 18, flexDirection: "row", alignItems: "center" }}>
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
      </View>
    </TouchableOpacity>
  );
};
