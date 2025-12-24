import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Shield, Clock, Calendar } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BlockSchedule } from "@/lib/appBlocking";
import { getLocalIcon } from "@/lib/appIcons";
import { getAppIconEmoji } from "./constants";

interface ScheduleCardProps {
  schedule: BlockSchedule;
  isDark: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export const ScheduleCard = ({
  schedule,
  isDark,
  onPress,
  onLongPress,
}: ScheduleCardProps) => {
  const { t } = useTranslation();

  // Get app icons for this schedule
  const scheduleAppIcons = schedule.apps.slice(0, 3).map((pkgName) => {
    const localIcon = getLocalIcon(pkgName, pkgName);
    return { packageName: pkgName, icon: localIcon };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={onLongPress}
      onPress={onPress}
      style={{
        backgroundColor: isDark
          ? "rgba(255, 255, 255, 0.06)"
          : "#ffffff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isDark
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Top Row: Name and Lock Icon */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 6,
        }}
      >
        <View style={{ flex: 1 }}>
          {/* Schedule Name */}
          <Text
            style={{
              fontSize: 22,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#111827",
              letterSpacing: -0.3,
              marginBottom: 8,
            }}
          >
            {schedule.name}
          </Text>

          {/* Time Range */}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Clock
              size={16}
              color={isDark ? "#9ca3af" : "#6b7280"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontSize: 16,
                color: isDark ? "#9ca3af" : "#6b7280",
                fontWeight: "500",
              }}
            >
              {schedule.startTime} - {schedule.endTime}
            </Text>
          </View>
        </View>

        {/* Lock Icon / Status Indicator */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: schedule.isActive
              ? "rgba(239, 68, 68, 0.15)"
              : isDark
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Shield
            size={22}
            color={schedule.isActive ? "#ef4444" : isDark ? "#6b7280" : "#9ca3af"}
            fill={schedule.isActive ? "#ef4444" : "transparent"}
          />
        </View>
      </View>

      {/* Apps Blocked Row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Shield
            size={16}
            color={isDark ? "#ef4444" : "#dc2626"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#ffffff" : "#111827",
              fontWeight: "500",
            }}
          >
            {t("blocking.appsBlocked") || "Apps Blocked"}
          </Text>
        </View>

        {/* App Icons */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {scheduleAppIcons.map((app, idx) => (
            <View
              key={app.packageName}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                marginLeft: idx > 0 ? -8 : 0,
                backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: isDark ? "#000000" : "#ffffff",
                overflow: "hidden",
              }}
            >
              {app.icon ? (
                <Image
                  source={app.icon}
                  style={{ width: 24, height: 24, borderRadius: 4 }}
                />
              ) : (
                <Text style={{ fontSize: 14 }}>
                  {getAppIconEmoji(app.packageName, app.packageName)}
                </Text>
              )}
            </View>
          ))}
          {schedule.apps.length > 3 && (
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                marginLeft: -8,
                backgroundColor: isDark ? "#374151" : "#e5e7eb",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: isDark ? "#000000" : "#ffffff",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "600",
                  color: isDark ? "#9ca3af" : "#6b7280",
                }}
              >
                +{schedule.apps.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Active Days Row */}
      <View style={{ marginTop: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <Calendar
            size={16}
            color={isDark ? "#9ca3af" : "#6b7280"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={{
              fontSize: 14,
              color: isDark ? "#9ca3af" : "#6b7280",
              fontWeight: "500",
            }}
          >
            {t("blocking.activeDays") || "Active Days"}
          </Text>
        </View>

        {/* Day Pills */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
            const isActive = schedule.daysOfWeek.includes(index);
            return (
              <View
                key={index}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: isActive
                    ? "#ffffff"
                    : isDark
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: isActive
                      ? "#000000"
                      : isDark
                        ? "#6b7280"
                        : "#9ca3af",
                  }}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </TouchableOpacity>
  );
};
