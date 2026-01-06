import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

interface HealthProgressBarProps {
  healthScore: number;
  isDark: boolean;
}

export const HealthProgressBar: React.FC<HealthProgressBarProps> = ({
  healthScore,
  isDark,
}) => {
  const { t } = useTranslation();

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    if (healthScore >= 80) {
      return ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0"]; // Great - Rich emerald
    } else if (healthScore >= 60) {
      return ["#22c55e", "#4ade80", "#86efac", "#bbf7d0"]; // Good - Fresh green
    } else if (healthScore >= 40) {
      return ["#eab308", "#facc15", "#fde047", "#fef08a"]; // Average - Golden yellow
    }
    return ["#f97316", "#fb923c", "#fdba74", "#fed7aa"]; // Low - Orange warning
  };

  return (
    <View style={{ paddingHorizontal: 40, marginBottom: 24 }}>
      <View
        style={{
          height: 12,
          backgroundColor: isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.06)",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            height: "100%",
            width: `${healthScore}%`,
            borderRadius: 6,
            overflow: "hidden",
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 12,
          }}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              flex: 1,
              borderRadius: 6,
            }}
          />
          {/* Shine overlay */}
          <LinearGradient
            colors={[
              "rgba(255,255,255,0.4)",
              "rgba(255,255,255,0.1)",
              "rgba(255,255,255,0)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50%",
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
            }}
          />
        </View>
      </View>
      <Text
        style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 12,
          fontWeight: "600",
          color: isDark ? "#9ca3af" : "#6b7280",
          letterSpacing: 0.5,
        }}
      >
        {t("home.health")} • {healthScore}
      </Text>
    </View>
  );
};

export default HealthProgressBar;
