import React, { useState, useCallback } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useBlocking } from "@/context/BlockingContext";
import { BlockSchedule } from "@/lib/appBlocking";
import { useTranslation } from "react-i18next";

export default function CalendarPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const { schedules, refreshData } = useBlocking();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // Get schedules for the selected day
  const dayOfWeek = selectedDate.getDay();
  const activeSchedules = schedules.filter(
    (schedule) => schedule.isActive && schedule.daysOfWeek.includes(dayOfWeek)
  );

  // Generate hours (6 AM to 11 PM)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Navigate days
  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isPastDay = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

  // Format date
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#000000" : "#ffffff" }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isDark
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowLeft size={20} color={isDark ? "#ffffff" : "#111827"} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: isDark ? "#ffffff" : "#111827",
          }}
        >
          {t("blocking.calendarView") || "Calendar View"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Schedules Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: isDark ? "#9ca3af" : "#6b7280",
              marginBottom: 12,
            }}
          >
            {t("blocking.schedules") || "Schedules"} ({activeSchedules.length} {isToday ? t("blocking.activeToday") || "active today" : t("blocking.scheduledForDay") || "for this day"})
          </Text>

          {activeSchedules.length === 0 ? (
            <View
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "#f9fafb",
                borderRadius: 12,
                padding: 20,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: isDark ? "#9ca3af" : "#6b7280",
                  textAlign: "center",
                }}
              >
                {isPastDay
                  ? t("blocking.noSchedulesWere") || "No schedules were active on this day"
                  : isToday
                    ? t("blocking.noActiveSchedules") || "No active schedules for today"
                    : t("blocking.noSchedulesPlanned") || "No schedules planned for this day"}
              </Text>
            </View>
          ) : (
            activeSchedules.map((schedule, index) => {
              const colors = [
                "#3b82f6",
                "#8b5cf6",
                "#ec4899",
                "#f59e0b",
                "#10b981",
              ];
              const color = colors[index % colors.length];
              return (
                <View
                  key={schedule.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: isDark
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#f9fafb",
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 8,
                    borderLeftWidth: 4,
                    borderLeftColor: isPastDay ? (isDark ? "#6b7280" : "#9ca3af") : color,
                    opacity: isPastDay ? 0.6 : 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: isDark ? "#ffffff" : "#111827",
                      }}
                    >
                      {schedule.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: isDark ? "#9ca3af" : "#6b7280",
                        marginTop: 2,
                      }}
                    >
                      {schedule.startTime} - {schedule.endTime} • {schedule.apps.length} apps
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Date Navigation */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
              }}
            >
              {formatDate(selectedDate)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={goToPreviousDay}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={20} color={isDark ? "#ffffff" : "#111827"} />
            </TouchableOpacity>
            {!isToday && (
              <TouchableOpacity
                onPress={goToToday}
                style={{
                  paddingHorizontal: 12,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#3b82f6",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}
                >
                  Today
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={goToNextDay}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={20} color={isDark ? "#ffffff" : "#111827"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vertical Timeline */}
        <View style={{ paddingHorizontal: 20 }}>
          <View
            style={{
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.03)" : "#fafafa",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
              padding: 12,
            }}
          >
            <ScrollView
              style={{ height: 500 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={{ flexDirection: "row", height: hours.length * 60 }}>
                {/* Time labels column */}
                <View style={{ width: 50, paddingTop: 5 }}>
                  {hours.map((hour) => (
                    <View
                      key={hour}
                      style={{
                        height: 60,
                        justifyContent: "flex-start",
                        paddingRight: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: isDark ? "#9ca3af" : "#6b7280",
                          fontWeight: "500",
                          textAlign: "right",
                        }}
                      >
                        {hour % 12 === 0 ? 12 : hour % 12}
                        {hour < 12 ? "a" : "p"}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Events column */}
                <View
                  style={{
                    flex: 1,
                    position: "relative",
                    height: hours.length * 60,
                  }}
                >
                  {/* Hour lines */}
                  {hours.map((hour, index) => (
                    <View
                      key={hour}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: index * 60,
                        height: 1,
                        backgroundColor: isDark
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.05)",
                      }}
                    />
                  ))}

                  {/* Current time indicator (horizontal red line) */}
                  {isToday &&
                    (() => {
                      const now = new Date();
                      const currentHour = now.getHours();
                      const currentMinute = now.getMinutes();
                      if (currentHour >= 6 && currentHour < 24) {
                        const position = (currentHour - 6) * 60 + currentMinute;
                        return (
                          <>
                            <View
                              style={{
                                position: "absolute",
                                left: -8,
                                top: position - 4,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: "#ef4444",
                                zIndex: 11,
                              }}
                            />
                            <View
                              style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                top: position,
                                height: 2,
                                backgroundColor: "#ef4444",
                                zIndex: 10,
                              }}
                            />
                          </>
                        );
                      }
                      return null;
                    })()}

                  {/* Schedule blocks */}
                  {activeSchedules.map((schedule, index) => {
                    const [startHour, startMin] = schedule.startTime
                      .split(":")
                      .map(Number);
                    const [endHour, endMin] = schedule.endTime
                      .split(":")
                      .map(Number);

                    const topPosition = (startHour - 6) * 60 + startMin;
                    const height = (endHour - 6) * 60 + endMin - topPosition;

                    const colors = [
                      "#3b82f6",
                      "#8b5cf6",
                      "#ec4899",
                      "#f59e0b",
                      "#10b981",
                    ];
                    const color = isPastDay ? (isDark ? "#6b7280" : "#9ca3af") : colors[index % colors.length];

                    return (
                      <View
                        key={schedule.id}
                        style={{
                          position: "absolute",
                          left: 10,
                          top: topPosition,
                          height: Math.max(height, 30),
                          right: 10,
                          backgroundColor: isPastDay
                            ? (isDark ? "rgba(107, 114, 128, 0.2)" : "rgba(156, 163, 175, 0.2)")
                            : `${color}33`,
                          borderLeftWidth: 4,
                          borderLeftColor: color,
                          borderRadius: 8,
                          padding: 8,
                          justifyContent: "flex-start",
                          opacity: isPastDay ? 0.6 : 1,
                        }}
                      >
                        <Text
                          numberOfLines={height > 40 ? 2 : 1}
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: isPastDay
                              ? (isDark ? "#9ca3af" : "#6b7280")
                              : (isDark ? "#ffffff" : "#111827"),
                          }}
                        >
                          {schedule.name}
                        </Text>
                        {height > 40 && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: isPastDay
                                ? (isDark ? "#6b7280" : "#9ca3af")
                                : (isDark ? "#e5e7eb" : "#374151"),
                              marginTop: 2,
                            }}
                          >
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
