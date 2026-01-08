import React, { useEffect, useState, useMemo } from "react";
import { View, Text } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from "react-i18next";

export default function GraduationCap3DLoader() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const phrase = useMemo(() => {
    const phrases = t("loader.phrases", { returnObjects: true }) as string[];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }, [t]);
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
        {t("loader.loading")}
      </Text>
    </View>
  );
}
