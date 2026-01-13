import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { Crosshair } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";

interface HeroSectionProps {
  isDark: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isDark }) => {
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const ringScale1 = useRef(new Animated.Value(0.8)).current;
  const ringScale2 = useRef(new Animated.Value(0.8)).current;
  const ringOpacity1 = useRef(new Animated.Value(0.6)).current;
  const ringOpacity2 = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Slow rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Ring animations
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale1, {
            toValue: 1.3,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity1, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ringScale1, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity1, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(ringScale2, {
              toValue: 1.3,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity2, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ringScale2, {
              toValue: 0.8,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity2, {
              toValue: 0.4,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }, 1000);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const reverseSpin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  return (
    <View style={{ alignItems: "center", paddingVertical: 32 }}>
      {/* Animated rings */}
      <View style={{ position: "relative", width: 160, height: 160, alignItems: "center", justifyContent: "center" }}>
        {/* Outer glow */}
        <Animated.View
          style={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            opacity: ringOpacity1,
            transform: [{ scale: ringScale1 }],
          }}
        />

        {/* Pulsing rings */}
        <Animated.View
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 2,
            borderColor: "#3b82f6",
            opacity: ringOpacity1,
            transform: [{ scale: ringScale1 }],
          }}
        />
        <Animated.View
          style={{
            position: "absolute",
            width: 140,
            height: 140,
            borderRadius: 70,
            borderWidth: 1.5,
            borderColor: "#60a5fa",
            opacity: ringOpacity2,
            transform: [{ scale: ringScale2 }],
          }}
        />

        {/* Rotating outer ring */}
        <Animated.View
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: 60,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(59, 130, 246, 0.2)",
            borderStyle: "dashed",
            transform: [{ rotate: spin }],
          }}
        />

        {/* Main orb container */}
        <Animated.View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            overflow: "hidden",
            transform: [{ scale: pulseAnim }],
          }}
        >
          {/* Blur background */}
          <BlurView
            intensity={isDark ? 30 : 50}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />

          {/* Gradient background */}
          <LinearGradient
            colors={["#3b82f6", "#2563eb", "#1d4ed8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Glass overlay */}
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0.05)", "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Inner glow */}
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              borderRadius: 50,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          />

          {/* Icon with counter-rotation for stability */}
          <Animated.View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ rotate: reverseSpin }],
            }}
          >
            <Crosshair size={48} color="#ffffff" strokeWidth={2} />
          </Animated.View>
        </Animated.View>

        {/* Shadow layer */}
        <View
          style={{
            position: "absolute",
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "#3b82f6",
            shadowColor: "#3b82f6",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.5,
            shadowRadius: 24,
            elevation: 16,
            zIndex: -1,
          }}
        />
      </View>

      {/* Title */}
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: isDark ? "#ffffff" : "#111827",
          marginTop: 24,
          letterSpacing: -0.5,
        }}
      >
        {t("lockin.readyToEarnTime")}
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          fontSize: 15,
          color: isDark ? "#9ca3af" : "#6b7280",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        {t("lockin.lockInToEarn")}
      </Text>
    </View>
  );
};

export default HeroSection;
