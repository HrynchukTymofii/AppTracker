import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Plus } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BlockSchedule } from "@/lib/appBlocking";
import { SUGGESTED_SCHEDULES, SuggestedScheduleTemplate, formatDaysCompact } from "./constants";

interface SuggestedSchedulesProps {
  schedules: BlockSchedule[];
  isDark: boolean;
  onSelectTemplate: (template: SuggestedScheduleTemplate) => void;
}

export const SuggestedSchedules = ({
  schedules,
  isDark,
  onSelectTemplate,
}: SuggestedSchedulesProps) => {
  const { t } = useTranslation();

  // Only show when user has less than 2 schedules
  if (schedules.length >= 2) {
    return null;
  }

  // Filter out templates that match existing schedules (by name)
  const usedTemplateNames = schedules.map(s => s.name.toLowerCase());
  const availableTemplates = SUGGESTED_SCHEDULES.filter(template => {
    const templateName = (t(template.nameKey) || template.defaultName).toLowerCase();
    return !usedTemplateNames.some(name =>
      name.includes(templateName) || templateName.includes(name)
    );
  });

  if (availableTemplates.length === 0) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: isDark ? "#ffffff" : "#111827",
          marginBottom: 12,
        }}
      >
        {t("blocking.suggestedSchedules.title") || "Quick Start"}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10 }}
      >
        {availableTemplates.map((template) => (
          <TouchableOpacity
            key={template.id}
            onPress={() => onSelectTemplate(template)}
            activeOpacity={0.7}
            style={{
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.06)"
                : "#f9fafb",
              borderRadius: 14,
              padding: 14,
              width: 150,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Header with emoji and plus */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 24 }}>{template.emoji}</Text>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: isDark
                    ? "rgba(59, 130, 246, 0.2)"
                    : "rgba(59, 130, 246, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={14} color="#3b82f6" strokeWidth={2.5} />
              </View>
            </View>
            {/* Name */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: isDark ? "#ffffff" : "#111827",
                marginBottom: 6,
              }}
              numberOfLines={1}
            >
              {t(template.nameKey) || template.defaultName}
            </Text>
            {/* Time */}
            <Text
              style={{
                fontSize: 12,
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 4,
              }}
            >
              {template.startTime} - {template.endTime}
            </Text>
            {/* Days */}
            <Text
              style={{
                fontSize: 11,
                color: isDark ? "#6b7280" : "#9ca3af",
                fontWeight: "500",
              }}
            >
              {formatDaysCompact(template.daysOfWeek, t)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
