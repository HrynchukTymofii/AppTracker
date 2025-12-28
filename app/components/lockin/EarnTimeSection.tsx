import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Dumbbell, Clock, TrendingUp, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/context/ThemeContext";
import { useEarnedTime } from "@/context/EarnedTimeContext";

interface EarnTimeSectionProps {
  isDark: boolean;
  onStartExercise: () => void;
}

export const EarnTimeSection: React.FC<EarnTimeSectionProps> = ({
  isDark,
  onStartExercise,
}) => {
  const { accentColor } = useTheme();
  const { wallet, getTodayEarned, getTodaySpent, getWeekStats } = useEarnedTime();

  const todayEarned = getTodayEarned();
  const todaySpent = getTodaySpent();
  const weekStats = getWeekStats();

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
      {/* Section Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: isDark ? "#ffffff" : "#111827",
            letterSpacing: -0.3,
          }}
        >
          Earn Time
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.08)",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 20,
          }}
        >
          <Clock size={14} color="#3b82f6" />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: "#3b82f6",
              marginLeft: 6,
            }}
          >
            {wallet.availableMinutes.toFixed(1)} min
          </Text>
        </View>
      </View>

      {/* Balance Card */}
      <View
        style={{
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.15 : 0.06,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Available Balance */}
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#6b7280" : "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Available
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "800",
                color: "#3b82f6",
                marginTop: 4,
              }}
            >
              {wallet.availableMinutes.toFixed(1)}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#6b7280" : "#9ca3af",
                fontWeight: "500",
              }}
            >
              minutes
            </Text>
          </View>

          {/* Divider */}
          <View
            style={{
              width: 1,
              height: 60,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
            }}
          />

          {/* Today Stats */}
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isDark ? "#6b7280" : "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Today
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#10b981",
                }}
              >
                +{todayEarned.toFixed(1)}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: isDark ? "#6b7280" : "#9ca3af",
                  marginHorizontal: 4,
                }}
              >
                /
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#ef4444",
                }}
              >
                -{todaySpent.toFixed(1)}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#6b7280" : "#9ca3af",
                fontWeight: "500",
              }}
            >
              earned / spent
            </Text>
          </View>
        </View>

        {/* Week Stats Row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.04)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TrendingUp size={16} color="#10b981" />
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#9ca3af" : "#6b7280",
                marginLeft: 6,
              }}
            >
              This week:{" "}
              <Text style={{ color: "#10b981", fontWeight: "600" }}>
                +{weekStats.earned.toFixed(0)} min
              </Text>{" "}
              earned
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            <Text style={{ color: "#ef4444", fontWeight: "600" }}>
              -{weekStats.spent.toFixed(0)} min
            </Text>{" "}
            spent
          </Text>
        </View>
      </View>

      {/* Exercise CTA Card */}
      <TouchableOpacity
        onPress={onStartExercise}
        activeOpacity={0.7}
        style={{
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          borderRadius: 20,
          padding: 18,
          flexDirection: "row",
          alignItems: "center",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(16, 185, 129, 0.3)",
          shadowColor: "#10b981",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        {/* Icon with gradient */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 16,
            overflow: "hidden",
            shadowColor: "#10b981",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <LinearGradient
            colors={["#10b981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <Dumbbell size={26} color="#ffffff" strokeWidth={2} />
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: -0.3,
              }}
            >
              Exercise to Earn
            </Text>
          </View>
          <Text
            style={{
              fontSize: 13,
              color: isDark ? "rgba(255,255,255,0.5)" : "#94a3b8",
              lineHeight: 18,
            }}
          >
            Pushups, squats, or plank to earn minutes
          </Text>
        </View>

        {/* Arrow */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronRight
            size={18}
            color="#10b981"
            strokeWidth={2}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default EarnTimeSection;
