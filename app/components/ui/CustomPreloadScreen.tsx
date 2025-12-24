import { View, Text, Animated, useColorScheme as useSystemColorScheme, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Progress from "react-native-progress";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import AnimatedOrb from "@/components/AnimatedOrb";

const phrases = [
  "Building your focus environment…",
  "Almost ready!",
  "Stay present!",
  "Preparing your journey…",
  "Just a moment…"
];

// Default blue accent color RGB
const ACCENT_RGB = "59, 130, 246";

export default function CustomPreloadScreen() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colorScheme = useSystemColorScheme();
  const isDark = colorScheme === "dark";

  useEffect(() => {
    // Fade animation for text
    const animate = () => {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    };

    animate();

    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
      animate();
    }, 3000);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  // Gradient colors based on theme - more visible values
  const primaryGradientColors = isDark
    ? [`rgba(${ACCENT_RGB}, 0.18)`, `rgba(${ACCENT_RGB}, 0.08)`, "rgba(0, 0, 0, 0)"] as const
    : [`rgba(${ACCENT_RGB}, 0.15)`, `rgba(${ACCENT_RGB}, 0.06)`, "#ffffff"] as const;

  const cornerGradientColors = isDark
    ? [`rgba(${ACCENT_RGB}, 0.12)`, "transparent"] as const
    : [`rgba(${ACCENT_RGB}, 0.08)`, "transparent"] as const;

  const topGlowColors = isDark
    ? [`rgba(${ACCENT_RGB}, 0.10)`, "transparent"] as const
    : [`rgba(${ACCENT_RGB}, 0.08)`, "transparent"] as const;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#ffffff" }]}>
      {/* Primary gradient from top-left */}
      <LinearGradient
        colors={primaryGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}
      />
      {/* Bottom-right corner gradient */}
      <LinearGradient
        colors={cornerGradientColors}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0.5 }}
        style={styles.gradient}
      />
      {/* Top edge glow */}
      <LinearGradient
        colors={topGlowColors}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.3 }}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Animated 3D Orb */}
          <View style={styles.orbContainer}>
            <AnimatedOrb size={180} level={3} />
          </View>

          {/* Title */}
          <Text
            style={{
              marginTop: 40,
              fontSize: 36,
              fontWeight: "bold",
              color: isDark ? "#ffffff" : "#111827",
              textAlign: "center",
            }}
          >
            LockIn
          </Text>

          {/* Animated phrase */}
          <Animated.Text
            style={{
              opacity: fadeAnim,
              marginTop: 20,
              fontSize: 16,
              color: isDark ? "#9ca3af" : "#6b7280",
              textAlign: "center",
              fontWeight: "500",
            }}
          >
            {phrases[currentPhraseIndex]}
          </Animated.Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Progress.Bar
              progress={1}
              indeterminate
              width={280}
              color={isDark ? "#3b82f6" : "#3b82f6"}
              unfilledColor={isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.15)"}
              borderWidth={0}
              borderRadius={6}
              height={8}
            />
          </View>
        </View>
      </SafeAreaView>
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
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  orbContainer: {
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    marginTop: 40,
    alignItems: "center",
  },
});
