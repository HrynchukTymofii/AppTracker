import React from "react";
import { View, Text } from "react-native";
import { CheckCircle } from "lucide-react-native";
import { Achievement } from "./achievements";

interface AchievementBadgeProps {
  achievement: Achievement;
  isDark: boolean;
}

export const AchievementBadge = ({
  achievement,
  isDark,
}: AchievementBadgeProps) => {
  const Icon = achievement.icon;

  return (
    <View
      style={{
        width: "31%",
        borderRadius: 16,
        backgroundColor: achievement.unlocked
          ? isDark ? "rgba(255, 255, 255, 0.08)" : "#ffffff"
          : isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: achievement.unlocked
          ? achievement.color + "40"
          : isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        opacity: achievement.unlocked ? 1 : 0.5,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: achievement.unlocked
            ? achievement.color + "20"
            : isDark
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.03)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          borderWidth: 2,
          borderColor: achievement.unlocked
            ? achievement.color
            : isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
        }}
      >
        <Icon
          size={24}
          color={
            achievement.unlocked
              ? achievement.color
              : isDark ? "#64748b" : "#94a3b8"
          }
          strokeWidth={2.5}
        />
      </View>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "700",
          color: achievement.unlocked
            ? isDark ? "#ffffff" : "#111827"
            : isDark
              ? "#64748b"
              : "#94a3b8",
          textAlign: "center",
          lineHeight: 13,
        }}
      >
        {achievement.title}
      </Text>

      {achievement.unlocked && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: "#10B981",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={14} color="#ffffff" fill="#10B981" strokeWidth={3} />
        </View>
      )}
    </View>
  );
};
