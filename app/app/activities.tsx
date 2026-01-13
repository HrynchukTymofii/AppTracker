import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Clock, Check, X, Camera, History, Dumbbell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useLockIn, LockInSession } from "@/context/LockInContext";
import { useTranslation } from "react-i18next";
import { ThemedBackground } from "@/components/ui/ThemedBackground";

const formatDuration = (minutes: number): string => {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
};

interface GroupedSessions {
  date: string;
  label: string;
  sessions: LockInSession[];
}

export default function ActivitiesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const { t } = useTranslation();
  const { sessionHistory } = useLockIn();

  // Group sessions by day
  const groupedSessions = useMemo(() => {
    const groups: Map<string, LockInSession[]> = new Map();

    sessionHistory.forEach((session) => {
      const date = new Date(session.completedAt || session.startedAt);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(session);
    });

    // Convert to array and sort by date (newest first)
    const result: GroupedSessions[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayKey = today.toISOString().split("T")[0];
    const yesterdayKey = yesterday.toISOString().split("T")[0];

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => b.localeCompare(a));

    sortedKeys.forEach((dateKey) => {
      let label: string;
      if (dateKey === todayKey) {
        label = t("lockin.today");
      } else if (dateKey === yesterdayKey) {
        label = t("lockin.yesterday");
      } else {
        const date = new Date(dateKey);
        label = date.toLocaleDateString(undefined, {
          weekday: "long",
          month: "short",
          day: "numeric"
        });
      }

      result.push({
        date: dateKey,
        label,
        sessions: groups.get(dateKey)!,
      });
    });

    return result;
  }, [sessionHistory, t]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit"
    });
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

  const renderSession = (session: LockInSession) => (
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
            {formatTime(session.completedAt || session.startedAt)}
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

      {/* Earned Minutes */}
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
  );

  return (
    <ThemedBackground>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <ArrowLeft size={20} color={isDark ? "#ffffff" : "#111827"} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <History size={22} color={isDark ? "#ffffff" : "#111827"} />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: isDark ? "#ffffff" : "#111827",
                marginLeft: 10,
              }}
            >
              {t("lockin.allActivities")}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {groupedSessions.length > 0 ? (
            groupedSessions.map((group) => (
              <View key={group.date} style={{ marginBottom: 24 }}>
                {/* Date Header */}
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                  }}
                >
                  {group.label}
                </Text>

                {/* Sessions for this day */}
                {group.sessions.map(renderSession)}
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
              <View style={{ padding: 40, alignItems: "center" }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <History size={32} color={isDark ? "#6b7280" : "#9ca3af"} />
                </View>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "600",
                    color: isDark ? "#9ca3af" : "#6b7280",
                    marginBottom: 6,
                  }}
                >
                  {t("lockin.noSessions")}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: isDark ? "#6b7280" : "#9ca3af",
                    textAlign: "center",
                  }}
                >
                  {t("lockin.startFirst")}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedBackground>
  );
}
