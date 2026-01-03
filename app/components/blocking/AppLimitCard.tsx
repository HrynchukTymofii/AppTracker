import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react-native";
import { DailyLimit } from "@/lib/appBlocking";
import { getLocalIcon } from "@/lib/appIcons";
import { getAppIconEmoji, formatTime } from "./constants";

interface AppLimitCardProps {
  limit: DailyLimit;
  isDark: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export const AppLimitCard = ({
  limit,
  isDark,
  onPress,
  onLongPress,
}: AppLimitCardProps) => {
  const { t } = useTranslation();
  const localIcon = getLocalIcon(limit.packageName, limit.appName);
  const usagePercent = Math.min((limit.usedMinutes / limit.limitMinutes) * 100, 100);
  const isExceeded = limit.usedMinutes >= limit.limitMinutes;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.05)"
          : "#ffffff",
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: isExceeded
          ? "rgba(239, 68, 68, 0.3)"
          : isDark
            ? "rgba(255, 255, 255, 0.08)"
            : "rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* App Icon with Blocked Overlay */}
      <View style={{ position: "relative", marginRight: 12 }}>
        {localIcon ? (
          <Image
            source={localIcon}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              opacity: isExceeded ? 0.4 : 1,
            }}
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: isDark ? "#374151" : "#e5e7eb",
              alignItems: "center",
              justifyContent: "center",
              opacity: isExceeded ? 0.4 : 1,
            }}
          >
            <Text style={{ fontSize: 22 }}>
              {getAppIconEmoji(limit.packageName, limit.appName)}
            </Text>
          </View>
        )}
        {/* Lock overlay when blocked */}
        {isExceeded && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 12,
              backgroundColor: "rgba(239, 68, 68, 0.85)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={20} color="#ffffff" strokeWidth={2.5} />
          </View>
        )}
      </View>

      {/* App Name and Usage Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: isDark ? "#ffffff" : "#111827",
            marginBottom: 4,
          }}
        >
          {limit.appName}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: isExceeded
              ? "#ef4444"
              : isDark ? "#9ca3af" : "#6b7280",
          }}
        >
          {isExceeded
            ? (t("blocking.limitExceeded") || "Limit exceeded")
            : `${formatTime(limit.usedMinutes)} / ${formatTime(limit.limitMinutes)}`}
        </Text>
      </View>

      {/* Time Display with Fill Indicator */}
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#f3f4f6",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Fill from bottom to top */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${usagePercent}%`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={
              isExceeded
                ? ["rgba(239, 68, 68, 0.6)", "rgba(239, 68, 68, 0.3)"]
                : usagePercent > 75
                  ? ["rgba(245, 158, 11, 0.6)", "rgba(245, 158, 11, 0.3)"]
                  : ["rgba(59, 130, 246, 0.6)", "rgba(59, 130, 246, 0.3)"]
            }
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={{
              flex: 1,
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          />
        </View>
        {/* Time Text */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: isExceeded
              ? "#ef4444"
              : isDark ? "#ffffff" : "#111827",
            zIndex: 1,
          }}
        >
          {formatTime(limit.limitMinutes)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
