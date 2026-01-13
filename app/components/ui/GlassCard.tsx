import React from "react";
import { View, ViewStyle, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: "light" | "medium" | "heavy";
  borderRadius?: number;
  padding?: number;
  noBorder?: boolean;
  glowColor?: string;
}

/**
 * Apple-style frosted glass card with subtle gradients and blur effects.
 * Creates a premium, modern look with depth and translucency.
 */
export function GlassCard({
  children,
  style,
  intensity = "medium",
  borderRadius = 20,
  padding = 16,
  noBorder = false,
  glowColor,
}: GlassCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const blurIntensity = {
    light: 20,
    medium: 40,
    heavy: 60,
  }[intensity];

  const backgroundOpacity = {
    light: isDark ? 0.03 : 0.4,
    medium: isDark ? 0.05 : 0.6,
    heavy: isDark ? 0.08 : 0.8,
  }[intensity];

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: "hidden",
          borderWidth: noBorder ? 0 : 1,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(255, 255, 255, 0.5)",
        },
        style,
      ]}
    >
      {/* Background blur */}
      <BlurView
        intensity={blurIntensity}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />

      {/* Glass background with gradient */}
      <LinearGradient
        colors={
          isDark
            ? [
                `rgba(255, 255, 255, ${backgroundOpacity})`,
                `rgba(255, 255, 255, ${backgroundOpacity * 0.5})`,
              ]
            : [
                `rgba(255, 255, 255, ${backgroundOpacity})`,
                `rgba(255, 255, 255, ${backgroundOpacity * 0.8})`,
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top highlight for 3D effect */}
      <LinearGradient
        colors={
          isDark
            ? ["rgba(255, 255, 255, 0.1)", "transparent"]
            : ["rgba(255, 255, 255, 0.8)", "transparent"]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { height: "50%" }]}
      />

      {/* Optional glow effect */}
      {glowColor && (
        <LinearGradient
          colors={[`${glowColor}20`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      {/* Content */}
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

/**
 * Smaller glass pill for stats and badges
 */
export function GlassPill({
  children,
  style,
  color,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  color?: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        {
          borderRadius: 12,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.06)",
        },
        style,
      ]}
    >
      <BlurView
        intensity={30}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={
          color
            ? [`${color}15`, `${color}08`]
            : isDark
            ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.03)"]
            : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        {children}
      </View>
    </View>
  );
}

export default GlassCard;
