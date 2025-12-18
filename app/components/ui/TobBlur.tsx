import React from "react";
import { StyleSheet, useColorScheme as useSystemColorScheme } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

export default function TopBlur() {
  const insets = useSafeAreaInsets();

  // Try to use custom theme, fall back to system theme if not in provider
  let colorScheme: "light" | "dark";
  try {
    const { colorScheme: themeColorScheme } = useTheme();
    colorScheme = themeColorScheme;
  } catch {
    // Fall back to system color scheme if not in ThemeProvider
    const systemColorScheme = useSystemColorScheme();
    colorScheme = systemColorScheme === "dark" ? "dark" : "light";
  }

  // Choose tint based on theme
  const tint = colorScheme === "light" ? "light" : "dark";

  return (
    <BlurView
      intensity={80}
      tint={tint}
      style={[styles.blur, { height: insets.top }]}
    />
  );
}

const styles = StyleSheet.create({
  blur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
