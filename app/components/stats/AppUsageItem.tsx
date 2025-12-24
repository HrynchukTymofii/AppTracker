import React from "react";
import { View, Text, Image, Animated } from "react-native";
import { getBarColor } from "./constants";

// App Usage Item Component (matches homepage style)
export const AppUsageItem = ({
  appName,
  duration,
  percentage,
  iconUrl,
  isDark,
  index = 0,
  isLast = false,
}: {
  appName: string;
  duration: string;
  percentage: number;
  iconUrl: any;
  isDark: boolean;
  index?: number;
  isLast?: boolean;
}) => {
  // Handle both base64 URIs and local require() images
  const imageSource = typeof iconUrl === "string" ? { uri: iconUrl } : iconUrl;

  // Color based on rank (like homepage)
  const barColor = getBarColor(index);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDark
          ? "rgba(255, 255, 255, 0.06)"
          : "rgba(0, 0, 0, 0.04)",
      }}
    >
      <Image
        source={imageSource}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          marginRight: 12,
        }}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#111827",
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {appName}
        </Text>
        {/* Usage Progress Bar */}
        <View
          style={{
            height: 4,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.06)",
            borderRadius: 2,
            marginTop: 4,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              height: "100%",
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: barColor,
              borderRadius: 2,
            }}
          />
        </View>
      </View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "600",
          color: isDark ? "#9ca3af" : "#6b7280",
          marginLeft: 12,
        }}
      >
        {duration}
      </Text>
    </View>
  );
};
