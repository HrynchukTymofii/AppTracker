import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Clock, Check, X, Camera, ChevronRight, History, Dumbbell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { LockInSession } from "@/context/LockInContext";
import { useTranslation } from "react-i18next";

interface SessionHistoryProps {
  sessions: LockInSession[];
  isDark: boolean;
  onSeeAll: () => void;
}

const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  isDark,
  onSeeAll,
}) => {
  const { t } = useTranslation();
  const recentSessions = sessions.slice(0, 5);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return days === 1 ? t("lockin.yesterday") : t("lockin.daysAgo", { count: days });
    if (hours > 0) return t("lockin.hoursAgo", { count: hours });
    if (minutes > 0) return t("lockin.minutesAgo", { count: minutes });
    return t("lockin.justNow");
  };

  const getStatusColor = (status: string, type?: string) => {
    if (type === "exercise") {
      return status === "completed" ? "#10b981" : "#ef4444";
    }
    switch (status) {
      case "completed":
        return "#10b981";
      case "cancelled":
      case "failed":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string, type?: string) => {
    if (type === "exercise") {
      return <Dumbbell size={14} color="#ffffff" />;
    }
    switch (status) {
      case "completed":
        return <Check size={14} color="#ffffff" />;
      case "cancelled":
      case "failed":
        return <X size={12} color="#ffffff" />;
      default:
        return null;
    }
  };

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <History size={20} color={isDark ? "#ffffff" : "#111827"} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: isDark ? "#ffffff" : "#111827",
              marginLeft: 8,
            }}
          >
            {t("lockin.recentActivities")}
          </Text>
        </View>
        {sessions.length > 5 && (
          <TouchableOpacity
            onPress={onSeeAll}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#3b82f6",
              }}
            >
              {t("lockin.seeAll")}
            </Text>
            <ChevronRight size={16} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sessions */}
      {recentSessions.length > 0 ? (
        recentSessions.map((session) => (
          <View
            key={session.id}
            style={{
              borderRadius: 14,
              marginBottom: 10,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
            }}
          >
            <BlurView
              intensity={isDark ? 20 : 35}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={isDark
                ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"]
                : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Top shine */}
            <LinearGradient
              colors={isDark ? ["rgba(255, 255, 255, 0.06)", "transparent"] : ["rgba(255, 255, 255, 0.4)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.6 }}
              style={[StyleSheet.absoluteFill, { height: "60%" }]}
            />
            <View style={{ padding: 14, flexDirection: "row", alignItems: "center" }}>
            {/* Status indicator */}
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: getStatusColor(session.status, session.type),
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              {getStatusIcon(session.status, session.type)}
            </View>

            {/* Content */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: isDark ? "#ffffff" : "#111827",
                  marginBottom: 4,
                }}
                numberOfLines={1}
              >
                {session.taskDescription || t("lockin.focusSession")}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Clock size={12} color={isDark ? "#6b7280" : "#9ca3af"} />
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#6b7280" : "#9ca3af",
                    marginLeft: 4,
                  }}
                >
                  {formatDuration(session.durationMinutes)}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#4b5563" : "#d1d5db",
                    marginHorizontal: 6,
                  }}
                >
                  •
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? "#6b7280" : "#9ca3af",
                  }}
                >
                  {formatTimeAgo(session.completedAt || session.startedAt)}
                </Text>
                {session.type === "verified" && (
                  <>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDark ? "#4b5563" : "#d1d5db",
                        marginHorizontal: 6,
                      }}
                    >
                      •
                    </Text>
                    <Camera size={12} color="#10b981" />
                  </>
                )}
              </View>
            </View>

            {/* Earned Minutes (shown instead of points) */}
            {session.durationMinutes > 0 && session.status === "completed" && (
              <View
                style={{
                  backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#10b981",
                  }}
                >
                  +{session.durationMinutes % 1 !== 0
                    ? session.durationMinutes.toFixed(1)
                    : session.durationMinutes} min
                </Text>
              </View>
            )}
            </View>
          </View>
        ))
      ) : (
        <View
          style={{
            borderRadius: 14,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.6)",
          }}
        >
          <BlurView
            intensity={isDark ? 20 : 35}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={isDark
              ? ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0.02)"]
              : ["rgba(255, 255, 255, 0.9)", "rgba(255, 255, 255, 0.7)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ padding: 32, alignItems: "center" }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <History size={28} color={isDark ? "#6b7280" : "#9ca3af"} />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: isDark ? "#9ca3af" : "#6b7280",
                marginBottom: 4,
              }}
            >
              {t("lockin.noSessions")}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDark ? "#6b7280" : "#9ca3af",
                textAlign: "center",
              }}
            >
              {t("lockin.startFirst")}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default SessionHistory;
