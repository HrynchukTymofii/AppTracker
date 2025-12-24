import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useColorScheme } from "@/hooks/useColorScheme";

interface ThemedBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: "subtle" | "medium" | "strong";
}

/**
 * A themed gradient background that adapts to the user's accent color choice.
 * Use this as the root container for any screen to get consistent theming.
 */
export function ThemedBackground({
  children,
  style,
  intensity = "medium"
}: ThemedBackgroundProps) {
  const { accentColor } = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Calculate gradient opacity based on intensity - more visible values
  const opacityMap = {
    subtle: { start: 0.08, mid: 0.04, corner: 0.06 },
    medium: { start: 0.15, mid: 0.06, corner: 0.10 },
    strong: { start: 0.25, mid: 0.10, corner: 0.15 },
  };
  const opacity = opacityMap[intensity];

  // Primary gradient colors - matches user card style
  const getPrimaryGradientColors = (): readonly [string, string, ...string[]] => {
    if (isDark) {
      return [
        `rgba(${accentColor.rgb}, ${opacity.start})`,
        `rgba(${accentColor.rgb}, ${opacity.mid})`,
        "rgba(0, 0, 0, 0)",
      ];
    } else {
      return [
        `rgba(${accentColor.rgb}, ${opacity.start})`,
        `rgba(${accentColor.rgb}, ${opacity.mid})`,
        "#ffffff",
      ];
    }
  };

  // Corner gradient for extra depth
  const getCornerGradientColors = (): readonly [string, string] => {
    if (isDark) {
      return [
        `rgba(${accentColor.rgb}, ${opacity.corner})`,
        "transparent",
      ];
    } else {
      return [
        `rgba(${accentColor.rgb}, ${opacity.corner * 0.7})`,
        "transparent",
      ];
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#ffffff" }, style]}>
      {/* Primary gradient from top-left corner - covers more area */}
      <LinearGradient
        colors={getPrimaryGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      />
      {/* Secondary gradient from bottom-right for depth */}
      <LinearGradient
        colors={getCornerGradientColors()}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0.5 }}
        style={styles.gradientSecondary}
      />
      {/* Top edge glow */}
      <LinearGradient
        colors={
          isDark
            ? [`rgba(${accentColor.rgb}, ${opacity.mid})`, "transparent"]
            : [`rgba(${accentColor.rgb}, ${opacity.mid * 0.8})`, "transparent"]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={styles.gradient}
      />
      {children}
    </View>
  );
}

/**
 * Standalone gradient for use without ThemeContext (e.g., preload screen).
 * Uses system color scheme and a default blue accent.
 */
interface SimpleGradientBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  accentRgb?: string; // Default: blue "59, 130, 246"
}

export function SimpleGradientBackground({
  children,
  style,
  accentRgb = "59, 130, 246", // Default blue
}: SimpleGradientBackgroundProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#ffffff" }, style]}>
      {/* Primary gradient from top-left */}
      <LinearGradient
        colors={
          isDark
            ? [`rgba(${accentRgb}, 0.15)`, `rgba(${accentRgb}, 0.06)`, "rgba(0, 0, 0, 0)"]
            : [`rgba(${accentRgb}, 0.12)`, `rgba(${accentRgb}, 0.05)`, "#ffffff"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      />
      {/* Bottom-right corner gradient */}
      <LinearGradient
        colors={
          isDark
            ? [`rgba(${accentRgb}, 0.10)`, "transparent"]
            : [`rgba(${accentRgb}, 0.07)`, "transparent"]
        }
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0.5 }}
        style={styles.gradientSecondary}
      />
      {/* Top edge glow */}
      <LinearGradient
        colors={
          isDark
            ? [`rgba(${accentRgb}, 0.08)`, "transparent"]
            : [`rgba(${accentRgb}, 0.06)`, "transparent"]
        }
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={styles.gradient}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientSecondary: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ThemedBackground;
