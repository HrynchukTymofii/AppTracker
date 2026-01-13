import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TrendingUp, TrendingDown, Flame } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { formatDuration } from "@/lib/usageTracking";

interface QuickStatsRowProps {
  streak: number;
  totalScreenTime: number;
  averageScreenTime: number;
  isDark: boolean;
}

const GlassStatCard = ({
  children,
  isDark,
  glowColor,
  flex = 1,
}: {
  children: React.ReactNode;
  isDark: boolean;
  glowColor?: string;
  flex?: number;
}) => (
  <View
    style={{
      flex,
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
    }}
  >
    <BlurView
      intensity={isDark ? 25 : 40}
      tint={isDark ? "dark" : "light"}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient
      colors={
        isDark
          ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"]
          : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    {/* Top shine */}
    <LinearGradient
      colors={isDark ? ["rgba(255, 255, 255, 0.08)", "transparent"] : ["rgba(255, 255, 255, 0.5)", "transparent"]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.6 }}
      style={[StyleSheet.absoluteFill, { height: "60%" }]}
    />
    {/* Optional glow */}
    {glowColor && (
      <LinearGradient
        colors={[`${glowColor}10`, "transparent"]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    )}
    <View style={{ padding: 14, alignItems: "center" }}>{children}</View>
  </View>
);

export const QuickStatsRow: React.FC<QuickStatsRowProps> = ({
  streak,
  totalScreenTime,
  averageScreenTime,
  isDark,
}) => {
  const { t } = useTranslation();

  const getTimeComparison = () => {
    if (averageScreenTime === 0) return { isLess: true, diff: `0${t("common.timeUnits.m")}` };
    const diff = totalScreenTime - averageScreenTime;
    const isLess = diff < 0;
    return {
      isLess,
      diff: formatDuration(Math.abs(diff), t),
    };
  };

  const timeComparison = getTimeComparison();

  // Dynamic font size based on text length
  const getDynamicFontSize = (text: string, baseSize: number = 20) => {
    const length = text.length;
    if (length <= 6) return baseSize;
    if (length <= 8) return baseSize - 2;
    if (length <= 10) return baseSize - 4;
    return baseSize - 6;
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: "600" as const,
    color: isDark ? "rgba(255, 255, 255, 0.5)" : "#9ca3af",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase" as const,
  };

  const valueStyle = {
    fontSize: 20,
    fontWeight: "700" as const,
    color: isDark ? "#ffffff" : "#111827",
  };

  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 24,
        flexDirection: "row",
        gap: 10,
      }}
    >
      {/* Streak Card */}
      <GlassStatCard isDark={isDark} glowColor="#f97316" flex={0.8}>
        <Text style={labelStyle}>{t("home.streak") || "STREAK"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Flame size={18} color="#f97316" fill="#f97316" style={{ marginRight: 6 }} />
          <Text style={valueStyle}>{streak}</Text>
        </View>
      </GlassStatCard>

      {/* Today Card */}
      <GlassStatCard isDark={isDark}>
        <Text style={labelStyle}>{t("home.today") || "TODAY"}</Text>
        <Text style={[valueStyle, { fontSize: getDynamicFontSize(formatDuration(totalScreenTime, t)) }]}>
          {formatDuration(totalScreenTime, t)}
        </Text>
      </GlassStatCard>

      {/* vs Average Card */}
      <GlassStatCard isDark={isDark} glowColor={timeComparison.isLess ? "#10b981" : "#ef4444"} flex={1.2}>
        <Text style={labelStyle}>{t("home.vsAverage") || "VS AVG"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {timeComparison.isLess ? (
            <TrendingDown size={16} color="#10b981" style={{ marginRight: 4 }} />
          ) : (
            <TrendingUp size={16} color="#ef4444" style={{ marginRight: 4 }} />
          )}
          <Text
            style={{
              fontSize: getDynamicFontSize(timeComparison.diff),
              fontWeight: "700",
              color: timeComparison.isLess ? "#10b981" : "#ef4444",
            }}
          >
            {timeComparison.isLess ? "-" : ""}
            {timeComparison.diff}
          </Text>
        </View>
      </GlassStatCard>
    </View>
  );
};

export default QuickStatsRow;
