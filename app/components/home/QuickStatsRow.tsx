import React from "react";
import { View, Text } from "react-native";
import { TrendingUp, TrendingDown } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { formatDuration } from "@/lib/usageTracking";

interface QuickStatsRowProps {
  streak: number;
  totalScreenTime: number;
  averageScreenTime: number;
  isDark: boolean;
}

export const QuickStatsRow: React.FC<QuickStatsRowProps> = ({
  streak,
  totalScreenTime,
  averageScreenTime,
  isDark,
}) => {
  const { t } = useTranslation();

  const getTimeComparison = () => {
    if (averageScreenTime === 0) return { isLess: true, diff: "0m" };
    const diff = totalScreenTime - averageScreenTime;
    const isLess = diff < 0;
    return {
      isLess,
      diff: formatDuration(Math.abs(diff)),
    };
  };

  const timeComparison = getTimeComparison();

  const cardStyle = {
    flex: 1,
    backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
    borderRadius: 12,
    padding: 12,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
  };

  const labelStyle = {
    fontSize: 10,
    fontWeight: "600" as const,
    color: isDark ? "#6b7280" : "#9ca3af",
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: "uppercase" as const,
  };

  const valueStyle = {
    fontSize: 18,
    fontWeight: "bold" as const,
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
      <View style={cardStyle}>
        <Text style={labelStyle}>{t("home.streak") || "STREAK"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 14, marginRight: 4 }}>🔥</Text>
          <Text style={valueStyle}>{streak}</Text>
        </View>
      </View>

      {/* Today Card */}
      <View style={cardStyle}>
        <Text style={labelStyle}>{t("home.today") || "TODAY"}</Text>
        <Text style={valueStyle}>{formatDuration(totalScreenTime)}</Text>
      </View>

      {/* vs Average Card */}
      <View style={cardStyle}>
        <Text style={labelStyle}>{t("home.vsAverage") || "VS AVG"}</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {timeComparison.isLess ? (
            <TrendingDown size={14} color="#10b981" style={{ marginRight: 3 }} />
          ) : (
            <TrendingUp size={14} color="#ef4444" style={{ marginRight: 3 }} />
          )}
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: timeComparison.isLess ? "#10b981" : "#ef4444",
            }}
          >
            {timeComparison.isLess ? "-" : "+"}
            {timeComparison.diff}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default QuickStatsRow;
