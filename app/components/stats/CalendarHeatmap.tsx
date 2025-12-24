import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { getHeatmapColor } from "./constants";

interface CalendarHeatmapProps {
  data: any[];
  isDark: boolean;
  onDayPress: (day: any) => void;
  weekOffset?: number;
}

export const CalendarHeatmap = ({
  data,
  isDark,
  onDayPress,
  weekOffset = 0,
}: CalendarHeatmapProps) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("window");
  const cellSize = (width - 80) / 7;

  // Get the month that contains the selected week
  const getMonthForWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Calculate the start of the selected week (going back 6 days + weekOffset)
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6 + (weekOffset * 7));
    return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}`;
  };

  // Organize data by month
  const organizeDataByMonth = () => {
    const months: { [key: string]: any[] } = {};
    data.forEach((day) => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(day);
    });
    return months;
  };

  const monthsData = organizeDataByMonth();
  const targetMonth = getMonthForWeek();
  // Only show the month containing the selected week
  const sortedMonthKeys = Object.keys(monthsData).includes(targetMonth)
    ? [targetMonth]
    : Object.keys(monthsData).sort().reverse().slice(0, 1);

  const getMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  const generateMonthGrid = (monthKey: string, daysInMonth: any[]) => {
    const [year, month] = monthKey.split("-");
    const firstDay = new Date(parseInt(year), parseInt(month) - 1, 1);
    const lastDay = new Date(parseInt(year), parseInt(month), 0);
    const daysInMonthCount = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const dataMap = new Map(daysInMonth.map((d) => [d.date, d]));

    const grid = [];
    let currentWeek: React.ReactNode[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(
        <View
          key={`empty-start-${i}`}
          style={{
            width: cellSize - 4,
            height: cellSize - 4,
            margin: 2,
          }}
        />
      );
    }

    for (let day = 1; day <= daysInMonthCount; day++) {
      const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
      const dayData = dataMap.get(dateStr);

      if (dayData) {
        const bgColor = getHeatmapColor(dayData.health_score, isDark);
        currentWeek.push(
          <TouchableOpacity
            key={dateStr}
            onPress={() => onDayPress(dayData)}
            activeOpacity={0.7}
            style={{
              width: cellSize - 4,
              height: cellSize - 4,
              margin: 2,
              backgroundColor: bgColor,
              borderRadius: 6,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#ffffff" }}>{day}</Text>
          </TouchableOpacity>
        );
      } else {
        currentWeek.push(
          <View
            key={`empty-${dateStr}`}
            style={{
              width: cellSize - 4,
              height: cellSize - 4,
              margin: 2,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: 6,
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            }}
          />
        );
      }

      if (currentWeek.length === 7) {
        grid.push(
          <View key={`week-${grid.length}`} style={{ flexDirection: "row", justifyContent: "center" }}>
            {currentWeek}
          </View>
        );
        currentWeek = [];
      }
    }

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(
        <View
          key={`empty-end-${currentWeek.length}`}
          style={{
            width: cellSize - 4,
            height: cellSize - 4,
            margin: 2,
          }}
        />
      );
    }

    if (currentWeek.length > 0) {
      grid.push(
        <View key={`week-${grid.length}`} style={{ flexDirection: "row", justifyContent: "center" }}>
          {currentWeek}
        </View>
      );
    }

    return grid;
  };

  return (
    <View>
      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: isDark ? "#9ca3af" : "#6b7280" }}>
          {t("stats.health.label")}
        </Text>
        {[
          { label: t("stats.health.poor"), color: isDark ? "#ef4444" : "#dc2626" },
          { label: t("stats.health.low"), color: isDark ? "#f97316" : "#ea580c" },
          { label: t("stats.health.avg"), color: isDark ? "#facc15" : "#ca8a04" },
          { label: t("stats.health.good"), color: isDark ? "#84cc16" : "#65a30d" },
          { label: t("stats.health.great"), color: isDark ? "#22c55e" : "#16a34a" },
        ].map((item) => (
          <View key={item.label} style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                backgroundColor: item.color,
                marginRight: 4,
              }}
            />
            <Text style={{ fontSize: 10, color: isDark ? "#9ca3af" : "#6b7280" }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Day Names */}
      <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 8 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <View key={index} style={{ width: cellSize - 4, margin: 2, alignItems: "center" }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: isDark ? "#9ca3af" : "#6b7280" }}>
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      {data.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={{ fontSize: 14, color: isDark ? "#9ca3af" : "#6b7280" }}>
            {t("stats.noUsageData")}
          </Text>
        </View>
      ) : (
        sortedMonthKeys.map((monthKey) => (
          <View key={monthKey} style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              {getMonthLabel(monthKey)}
            </Text>
            {generateMonthGrid(monthKey, monthsData[monthKey])}
          </View>
        ))
      )}
    </View>
  );
};
