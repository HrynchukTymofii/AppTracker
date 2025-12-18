import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";

const motivatingPhrases = [
  "Your journey to digital wellness starts now",
  "Every moment of focus counts",
  "Building better habits, one step at a time",
  "Stay focused, stay present",
  "Reclaim your time, reclaim your life",
  "Progress over perfection",
  "Small steps lead to big changes",
  "You're stronger than your distractions",
  "Make today count",
  "Focus is your superpower",
  "Break free from digital chains",
  "Your future self will thank you",
  "Discipline equals freedom",
  "Master your phone, master your life",
  "Be present in the moment",
  "Less screen time, more real time",
  "Your attention is valuable",
  "Invest in yourself today",
  "Create space for what matters",
  "Mindfulness begins with awareness"
];

export default function GraduationCap3DLoader() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [phrase] = useState(() => motivatingPhrases[Math.floor(Math.random() * motivatingPhrases.length)]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 1 ? 0 : prev + 0.01));
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#000000" : "#ffffff",
        paddingHorizontal: 40,
      }}
    >
      {/* Motivating Phrase */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: "600",
          color: isDark ? "#ffffff" : "#111827",
          textAlign: "center",
          marginBottom: 40,
          lineHeight: 28,
        }}
      >
        {phrase}
      </Text>

      {/* Progress Bar */}
      <View
        style={{
          width: "100%",
          maxWidth: 300,
          height: 12,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            backgroundColor: isDark ? "#ffffff" : "#111827",
            borderRadius: 6,
          }}
        />
      </View>

      {/* Loading Text */}
      <Text
        style={{
          fontSize: 14,
          color: isDark ? "#9ca3af" : "#6b7280",
          marginTop: 16,
          fontWeight: "500",
        }}
      >
        Loading...
      </Text>
    </View>
  );
}
