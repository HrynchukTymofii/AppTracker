import { View, Text, Image, Animated, useColorScheme as useSystemColorScheme } from "react-native";
import * as Progress from "react-native-progress";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const phrases = [
  "Building your focus environment…",
  "Almost ready!",
  "Stay present!",
  "Preparing your journey…",
  "Just a moment…"
];

export default function CustomPreloadScreen() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
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

  useEffect(() => {
    // Pulse animation for orb
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
        {/* Orb with pulse animation */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          <View
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <Image
              source={require("@/assets/images/orb2.png")}
              style={{ width: 180, height: 180 }}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

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
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <Progress.Bar
            progress={1}
            indeterminate
            width={280}
            color={isDark ? "#ffffff" : "#111827"}
            unfilledColor={isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
            borderWidth={0}
            borderRadius={6}
            height={8}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
