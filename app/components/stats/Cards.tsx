import React from "react";
import { View, Text, Image } from "react-native";
import { AnimatedNumber } from "./AnimatedComponents";
import { ORB_IMAGES } from "./constants";

// Day Card Component
export const DayCard = ({
  dayName,
  dateNumber,
  orbLevel,
  isDark,
  hasData = true,
}: {
  dayName: string;
  dateNumber: number;
  orbLevel: number;
  isDark: boolean;
  hasData?: boolean;
}) => {
  const orbImage = ORB_IMAGES[Math.min(orbLevel - 1, 4)];

  return (
    <View
      style={{
        alignItems: "center",
        marginHorizontal: 3,
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
        borderRadius: 12,
        padding: 8,
        paddingVertical: 10,
        width: 48,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
        opacity: hasData ? 1 : 0.6,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: "600",
          color: isDark ? "#6b7280" : "#9ca3af",
          marginBottom: 6,
          letterSpacing: 0.5,
        }}
      >
        {dayName.toUpperCase()}
      </Text>
      <Image
        source={orbImage}
        style={{ width: 28, height: 28, marginBottom: 4, opacity: hasData ? 1 : 0.4 }}
        resizeMode="contain"
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: "bold",
          color: isDark ? "#ffffff" : "#111827",
        }}
      >
        {dateNumber}
      </Text>
    </View>
  );
};

// Stat Card Component
export const StatCard = ({
  title,
  value,
  subtitle,
  isDark,
  animated = false,
  numericValue,
  suffix = "",
}: {
  title: string;
  value: string;
  subtitle?: string;
  isDark: boolean;
  animated?: boolean;
  numericValue?: number;
  suffix?: string;
}) => {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f9fafb",
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          color: isDark ? "#6b7280" : "#9ca3af",
          marginBottom: 6,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
      {animated && numericValue !== undefined ? (
        <AnimatedNumber
          value={numericValue}
          suffix={suffix}
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        />
      ) : (
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {value}
        </Text>
      )}
      {subtitle && (
        <Text
          style={{
            fontSize: 11,
            color: isDark ? "#6b7280" : "#9ca3af",
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};
